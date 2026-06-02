-- ADICIONAR CAMPO DE NOME DA AGÊNCIA AO PERFIL
-- Execute este script no SQL Editor do seu Supabase

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS agency_name TEXT DEFAULT 'Alpha Digital';

-- Opcional: Atualizar perfis existentes que são admins para ter o nome padrão
UPDATE public.profiles 
SET agency_name = 'Alpha Digital' 
WHERE role = 'admin' AND agency_name IS NULL;
