const url = "https://whcfgflswdanptxsvfes.supabase.co/rest/v1/rpc/create_client_with_auth";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2ZnZmxzd2RhbnB0eHN2ZmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDA3MTgsImV4cCI6MjA4NzA3NjcxOH0.cvOq318HShJa3sqj3tPPkDO07lzr2xDJYFGX4PkA20k";

fetch(url, {
    method: 'POST',
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        p_name: 'Test Client',
        p_email: 'test' + Date.now() + '@example.com',
        p_phone: '123456789',
        p_password: 'testPassword123!',
        p_selected_accounts: []
    })
}).then(async r => {
    console.log("Status:", r.status);
    console.log("Result:", await r.text());
}).catch(console.error);
