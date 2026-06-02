// Query para listar todos os triggers em auth.users e funções do public schema
// Execute isso no SQL Editor do Supabase como query de diagnóstico

const queries = [
    `-- Triggers na tabela auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';`,

    `-- Todas as funções no schema public que podem estar quebradas
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY p.proname;`
];

console.log("=== EXECUTE ESTES SQLs NO SUPABASE SQL EDITOR ===\n");
queries.forEach((q, i) => {
    console.log(`--- Query ${i + 1} ---`);
    console.log(q);
    console.log();
});
