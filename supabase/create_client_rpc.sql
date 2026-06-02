-- ===============================================
-- RPC: create_client_with_auth
-- Substitui a Edge Function admin-create-client
-- Roda direto no banco, sem precisar de deploy
-- ===============================================

-- Habilitar extensão pgcrypto (necessária para crypt/gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.create_client_with_auth(
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT NULL,
    p_password TEXT DEFAULT NULL,
    p_selected_accounts UUID[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_client_id UUID;
    v_user_id UUID;
    v_caller_role TEXT;
BEGIN
    -- 1. Verificar que o chamador é admin
    SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
    IF v_caller_role IS NULL OR v_caller_role != 'admin' THEN
        RETURN json_build_object('error', 'Apenas administradores podem criar clientes');
    END IF;

    -- 2. Criar/atualizar registro do cliente
    INSERT INTO clients (name, email, phone, active)
    VALUES (p_name, p_email, COALESCE(p_phone, NULL), true)
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        phone = COALESCE(EXCLUDED.phone, clients.phone),
        active = true
    RETURNING id INTO v_client_id;

    -- 3. Verificar se auth user já existe
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

    IF v_user_id IS NULL THEN
        -- Criar novo auth user
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (
            instance_id, id, aud, role, email,
            encrypted_password, email_confirmed_at,
            raw_user_meta_data, raw_app_meta_data,
            confirmation_token, recovery_token,
            email_change_token_new, email_change_token_current,
            email_change, phone, phone_change, phone_change_token,
            reauthentication_token,
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id, 'authenticated', 'authenticated', p_email,
            crypt(p_password, gen_salt('bf')),
            NOW(),
            jsonb_build_object('full_name', p_name),
            jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
            '', '', '', '', '', NULL, '', '', '',
            NOW(), NOW()
        );

        -- Criar identity para login por email
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id,
            last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_user_id,
            jsonb_build_object('sub', v_user_id::text, 'email', p_email),
            'email', v_user_id::text,
            NOW(), NOW(), NOW()
        );
    ELSE
        -- Atualizar user existente
        UPDATE auth.users SET
            encrypted_password = crypt(p_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_user_meta_data = jsonb_build_object('full_name', p_name),
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    -- 4. Atualizar/criar profile
    INSERT INTO profiles (id, role, client_id)
    VALUES (v_user_id, 'client', v_client_id)
    ON CONFLICT (id) DO UPDATE SET
        client_id = v_client_id,
        role = 'client';

    -- 5. Criar permissões padrão
    INSERT INTO permissions (client_id, perms)
    VALUES (v_client_id, '{"view_spend": true, "view_campaigns": true, "download_reports": false, "view_ecommerce": false}'::jsonb)
    ON CONFLICT (client_id) DO NOTHING;

    -- 6. Vincular ad_accounts selecionadas
    IF p_selected_accounts IS NOT NULL AND array_length(p_selected_accounts, 1) > 0 THEN
        UPDATE ad_accounts SET client_id = v_client_id
        WHERE id = ANY(p_selected_accounts);
    END IF;

    -- 7. Retornar sucesso
    RETURN json_build_object(
        'success', true,
        'clientId', v_client_id,
        'clientName', p_name,
        'email', p_email,
        'message', 'Cliente ' || p_name || ' criado com sucesso!'
    );
END;
$$;
