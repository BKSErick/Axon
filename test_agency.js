// Verificar agency_name no perfil admin
const SUPABASE_URL = 'https://whcfgflswdanptxsvfes.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2ZnZmxzd2RhbnB0eHN2ZmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDA3MTgsImV4cCI6MjA4NzA3NjcxOH0.cvOq318HShJa3sqj3tPPkDO07lzr2xDJYFGX4PkA20k';

const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?role=eq.admin&select=id,full_name,email,role,agency_name`, {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
});
const data = await res.json();
console.log("=== PERFIS ADMIN ===");
data.forEach(p => {
    console.log(`  Nome: ${p.full_name}`);
    console.log(`  Email: ${p.email}`);
    console.log(`  Agency: "${p.agency_name}"`);
    console.log(`  ID: ${p.id}`);
    console.log('---');
});

// Verificar tabela de settings se existir
const res2 = await fetch(`${SUPABASE_URL}/rest/v1/agency_settings?select=*`, {
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
    }
});
if (res2.ok) {
    const data2 = await res2.json();
    console.log("\n=== AGENCY SETTINGS ===");
    console.log(JSON.stringify(data2, null, 2));
} else {
    console.log("\n(Tabela agency_settings não existe)");
}
