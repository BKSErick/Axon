const url = "https://whcfgflswdanptxsvfes.supabase.co/rest/v1/clients?limit=1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2ZnZmxzd2RhbnB0eHN2ZmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDA3MTgsImV4cCI6MjA4NzA3NjcxOH0.cvOq318HShJa3sqj3tPPkDO07lzr2xDJYFGX4PkA20k";

fetch(url, {
    method: 'GET',
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
}).then(async r => {
    console.log("Status:", r.status);
    console.log("Result:", await r.text());
}).catch(console.error);
