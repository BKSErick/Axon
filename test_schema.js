const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2ZnZmxzd2RhbnB0eHN2ZmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDA3MTgsImV4cCI6MjA4NzA3NjcxOH0.cvOq318HShJa3sqj3tPPkDO07lzr2xDJYFGX4PkA20k";

// Test 1: Can we even hit the REST API?
console.log("--- Test 1: GET /rest/v1/ (OpenAPI schema) ---");
const r1 = await fetch("https://whcfgflswdanptxsvfes.supabase.co/rest/v1/", {
    headers: { 'apikey': key }
});
console.log("Status:", r1.status);
const t1 = await r1.text();
if (r1.status !== 200) console.log("Body:", t1.substring(0, 500));
else console.log("OK - schema loads fine");

// Test 2: Can we query profiles table?
console.log("\n--- Test 2: GET /rest/v1/profiles?limit=1 ---");
const r2 = await fetch("https://whcfgflswdanptxsvfes.supabase.co/rest/v1/profiles?limit=1", {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
});
console.log("Status:", r2.status);
console.log("Body:", (await r2.text()).substring(0, 500));

// Test 3: Can we do auth signIn?
console.log("\n--- Test 3: POST /auth/v1/token (signInWithPassword) ---");
const r3 = await fetch("https://whcfgflswdanptxsvfes.supabase.co/auth/v1/token?grant_type=password", {
    method: 'POST',
    headers: { 'apikey': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'DEBDAMAS@DAMAS.COM', password: 'test123' })
});
console.log("Status:", r3.status);
console.log("Body:", (await r3.text()).substring(0, 500));

// Test 4: Check if permissions table is accessible 
console.log("\n--- Test 4: GET /rest/v1/permissions?limit=1 ---");
const r4 = await fetch("https://whcfgflswdanptxsvfes.supabase.co/rest/v1/permissions?limit=1", {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
});
console.log("Status:", r4.status);
console.log("Body:", (await r4.text()).substring(0, 500));
