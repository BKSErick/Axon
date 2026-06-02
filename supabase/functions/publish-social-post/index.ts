import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * publish-social-post
 * 
 * Called by pg_cron every 5 minutes. Checks for scheduled posts
 * whose scheduled_for time has passed and publishes them via Meta Graph API.
 * 
 * If Meta API permissions are not yet approved, it marks the post
 * as "ready_to_publish" and notifies the social media manager.
 */

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_GRAPH_URL = "https://graph.facebook.com/v22.0";

Deno.serve(async (req: Request) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const now = new Date().toISOString();

    // 1. Find all pending queue items whose scheduled time has passed
    const { data: queueItems, error: queueError } = await supabase
      .from("social_schedule_queue")
      .select("*, social_posts(*)")
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true })
      .limit(20);

    if (queueError) throw queueError;
    if (!queueItems || queueItems.length === 0) {
      return new Response(JSON.stringify({ message: "No posts to publish", count: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const results: any[] = [];

    for (const item of queueItems) {
      const post = item.social_posts;
      if (!post) {
        // Orphan queue item — mark as failed
        await supabase.from("social_schedule_queue")
          .update({ status: "failed", error_message: "Post not found" })
          .eq("id", item.id);
        continue;
      }

      try {
        // Get client's page token from social_client_profiles
        const { data: profile } = await supabase
          .from("social_client_profiles")
          .select("facebook_page_id, facebook_page_token, instagram_account_id")
          .eq("client_id", post.client_id)
          .single();

        if (!profile?.facebook_page_token) {
          // No page token configured — mark for manual publish
          await supabase.from("social_schedule_queue")
            .update({
              status: "failed",
              error_message: "Page token not configured. Configure the client's page in Social Media > Perfis IA.",
              attempts: (item.attempts || 0) + 1,
            })
            .eq("id", item.id);

          // Still update post status so the SM knows
          await supabase.from("social_posts")
            .update({ status: "failed", meta_error: "Page token missing" })
            .eq("id", post.id);

          results.push({ post_id: post.id, status: "failed", reason: "no_page_token" });
          continue;
        }

        let publishResult: any = null;

        // ============================================
        // FACEBOOK PUBLISHING
        // ============================================
        if (post.platform === "facebook") {
          const pageId = profile.facebook_page_id;
          const pageToken = profile.facebook_page_token;

          if (post.media_urls?.length > 0) {
            // Photo post — upload first photo
            const mediaUrl = post.media_urls[0];
            const fbRes = await fetch(`${META_GRAPH_URL}/${pageId}/photos`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                url: mediaUrl,
                message: post.content_text || "",
                access_token: pageToken,
              }),
            });
            publishResult = await fbRes.json();
          } else {
            // Text-only post
            const fbRes = await fetch(`${META_GRAPH_URL}/${pageId}/feed`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: post.content_text || "",
                access_token: pageToken,
              }),
            });
            publishResult = await fbRes.json();
          }
        }

        // ============================================
        // INSTAGRAM PUBLISHING
        // ============================================
        if (post.platform === "instagram") {
          const igAccountId = profile.instagram_account_id;
          const pageToken = profile.facebook_page_token;

          if (!igAccountId) {
            throw new Error("Instagram account ID not configured");
          }

          if (post.media_urls?.length > 0) {
            // Step 1: Create media container
            const mediaUrl = post.media_urls[0];
            const isVideo = mediaUrl.match(/\.(mp4|mov|avi)$/i);

            const containerRes = await fetch(`${META_GRAPH_URL}/${igAccountId}/media`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...(isVideo
                  ? { media_type: "VIDEO", video_url: mediaUrl }
                  : { image_url: mediaUrl }),
                caption: post.content_text || "",
                access_token: pageToken,
              }),
            });
            const container = await containerRes.json();

            if (container.id) {
              // Step 2: Publish
              // For videos, may need to wait for processing
              if (isVideo) {
                // Wait up to 60 seconds for video processing
                let ready = false;
                for (let i = 0; i < 12; i++) {
                  await new Promise((r) => setTimeout(r, 5000));
                  const statusRes = await fetch(
                    `${META_GRAPH_URL}/${container.id}?fields=status_code&access_token=${pageToken}`
                  );
                  const statusData = await statusRes.json();
                  if (statusData.status_code === "FINISHED") {
                    ready = true;
                    break;
                  }
                  if (statusData.status_code === "ERROR") {
                    throw new Error("Instagram video processing failed");
                  }
                }
                if (!ready) {
                  throw new Error("Instagram video processing timeout");
                }
              }

              const publishRes = await fetch(`${META_GRAPH_URL}/${igAccountId}/media_publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  creation_id: container.id,
                  access_token: pageToken,
                }),
              });
              publishResult = await publishRes.json();
            } else {
              throw new Error(container.error?.message || "Failed to create IG media container");
            }
          } else {
            throw new Error("Instagram requires media for posts");
          }
        }

        // Check for errors in the publish result
        if (publishResult?.error) {
          throw new Error(publishResult.error.message || JSON.stringify(publishResult.error));
        }

        // Success — update post and queue
        await supabase.from("social_posts").update({
          status: "published",
          published_at: new Date().toISOString(),
          meta_post_id: publishResult?.id || publishResult?.post_id || null,
        }).eq("id", post.id);

        await supabase.from("social_schedule_queue").update({
          status: "published",
          published_at: new Date().toISOString(),
        }).eq("id", item.id);

        results.push({ post_id: post.id, status: "published", meta_id: publishResult?.id });

      } catch (postError: any) {
        console.error(`Failed to publish post ${post.id}:`, postError);

        await supabase.from("social_schedule_queue").update({
          status: "failed",
          error_message: postError.message || "Unknown error",
          attempts: (item.attempts || 0) + 1,
        }).eq("id", item.id);

        await supabase.from("social_posts").update({
          status: "failed",
          meta_error: postError.message || "Unknown error",
        }).eq("id", post.id);

        results.push({ post_id: post.id, status: "failed", error: postError.message });
      }
    }

    return new Response(JSON.stringify({ message: "Publish cycle complete", results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Publish function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
