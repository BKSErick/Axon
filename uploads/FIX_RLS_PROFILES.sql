-- Corrige as politicas da tabela profiles que estavam impedindo upsert pelo client
DROP POLICY IF EXISTS "Profiles Update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles Insert" ON public.profiles;

CREATE POLICY "Profiles Update" ON public.profiles FOR UPDATE
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

CREATE POLICY "Profiles Insert" ON public.profiles FOR INSERT
WITH CHECK ( auth.uid() = id );
