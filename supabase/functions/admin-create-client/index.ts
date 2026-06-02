import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Verificar que o chamador é um admin autenticado
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Não autorizado" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || authHeader.replace("Bearer ", "");

        // Cliente com token do usuário (para verificar role)
        const supabaseUser = createClient(supabaseUrl, anonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user: callerUser }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !callerUser) {
            return new Response(JSON.stringify({ error: "Token inválido" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Verificar que é admin
        const { data: callerProfile } = await supabaseUser.from("profiles").select("role").eq("id", callerUser.id).single();
        if (!callerProfile || callerProfile.role !== "admin") {
            return new Response(JSON.stringify({ error: "Apenas administradores podem criar clientes" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 2. Ler dados do body
        const { name, email, phone, password, selectedAccounts = [] } = await req.json();

        if (!name || !email || !password) {
            return new Response(JSON.stringify({ error: "Nome, email e senha são obrigatórios" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 3. Cliente com service role (para admin operations)
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

        // 4. Criar o registro em 'clients' (upsert por email)
        const { data: client, error: clientError } = await supabaseAdmin
            .from("clients")
            .upsert(
                [{ name, email, phone: phone || null, active: true }],
                { onConflict: "email" }
            )
            .select()
            .single();

        if (clientError) {
            console.error("Erro ao criar client:", clientError);
            return new Response(JSON.stringify({ error: "Erro ao criar registro do cliente: " + clientError.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // 5. Criar o auth user via admin API (sem confirmação de email)
        const { data: authData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Marca como confirmado automaticamente
            user_metadata: { full_name: name },
        });

        if (createUserError) {
            // Se o usuário já existe, tentamos atualizar a senha
            if (createUserError.message?.includes("already been registered") || createUserError.message?.includes("already exists")) {
                console.log("Usuário já existe, atualizando...");

                // Buscar o user existente por email
                const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = users?.find((u: any) => u.email === email);

                if (existingUser) {
                    // Atualizar senha e metadata
                    await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
                        password,
                        email_confirm: true,
                        user_metadata: { full_name: name },
                    });

                    // Garantir que o profile tenha o client_id correto
                    await supabaseAdmin.from("profiles").update({ client_id: client.id }).eq("id", existingUser.id);
                }
            } else {
                console.error("Erro ao criar auth user:", createUserError);
                return new Response(JSON.stringify({ error: "Erro ao criar usuário: " + createUserError.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // 6. Criar permissões padrão
        await supabaseAdmin.from("permissions").upsert(
            [{ client_id: client.id, perms: { view_spend: true, view_campaigns: true, download_reports: false, view_ecommerce: false } }],
            { onConflict: "client_id" }
        );

        // 7. Vincular ad_accounts selecionadas
        if (selectedAccounts.length > 0) {
            const { error: accError } = await supabaseAdmin
                .from("ad_accounts")
                .update({ client_id: client.id })
                .in("id", selectedAccounts);

            if (accError) {
                console.error("Erro ao vincular contas:", accError);
            }
        }

        // 8. Retornar sucesso com dados para o admin montar a mensagem
        return new Response(
            JSON.stringify({
                success: true,
                clientId: client.id,
                clientName: name,
                email,
                message: `Cliente ${name} criado com sucesso!`,
            }),
            {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (err: any) {
        console.error("Erro fatal:", err);
        return new Response(
            JSON.stringify({ error: "Erro interno: " + err.message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
