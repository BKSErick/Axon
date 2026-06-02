import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const NOTION_KEY = Deno.env.get("NOTION_API_KEY");
    if (!NOTION_KEY) throw new Error("NOTION_API_KEY not configured");

    const { action, database_id, page_id, block_id, filter, sorts, page_size, properties, parent } = await req.json();

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${NOTION_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    };

    let url = "";
    let method = "GET";
    let body: string | undefined;

    switch (action) {
      case "query_database": {
        url = `${NOTION_API}/databases/${database_id}/query`;
        method = "POST";
        const payload: Record<string, unknown> = {};
        if (filter) payload.filter = filter;
        if (sorts) payload.sorts = sorts;
        if (page_size) payload.page_size = page_size;
        body = JSON.stringify(payload);
        break;
      }
      case "get_database": {
        url = `${NOTION_API}/databases/${database_id}`;
        break;
      }
      case "get_page": {
        url = `${NOTION_API}/pages/${page_id}`;
        break;
      }
      case "get_blocks": {
        url = `${NOTION_API}/blocks/${block_id}/children?page_size=${page_size || 100}`;
        break;
      }
      case "create_page": {
        url = `${NOTION_API}/pages`;
        method = "POST";
        body = JSON.stringify({ parent, properties });
        break;
      }
      case "update_page": {
        url = `${NOTION_API}/pages/${page_id}`;
        method = "PATCH";
        body = JSON.stringify({ properties });
        break;
      }
      case "search": {
        url = `${NOTION_API}/search`;
        method = "POST";
        body = JSON.stringify({ filter, page_size: page_size || 100 });
        break;
      }
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    const resp = await fetch(url, {
      method,
      headers,
      ...(body ? { body } : {}),
    });

    const data = await resp.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: resp.status,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
