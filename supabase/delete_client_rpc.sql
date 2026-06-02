-- RPC para deletar um usuário do auth.users (só admin pode chamar)
-- Execute no SQL Editor do Supabase

CREATE OR REPLACE FUNCTION public.delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    -- Verifica se quem está chamando é admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
    END IF;

    -- Deleta o usuário do auth (cascade vai limpar identities, sessions, etc.)
    DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Garante que a função tem as permissões corretas
GRANT EXECUTE ON FUNCTION public.delete_auth_user(UUID) TO authenticated;
