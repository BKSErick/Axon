const supabaseUrl = 'https://whcfgflswdanptxsvfes.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2ZnZmxzd2RhbnB0eHN2ZmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDA3MTgsImV4cCI6MjA4NzA3NjcxOH0.cvOq318HShJa3sqj3tPPkDO07lzr2xDJYFGX4PkA20k';

async function run() {
    console.log('[FORCING TEST] Inserting real report task into queue...');

    const robsonId = 'ed478f61-1e86-4da2-bf01-02adf71f934e';
    const cell = '5511996515814';

    // Insert using REST API to avoid dependencies
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/notification_queue`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            client_id: robsonId,
            type: 'real_performance_report',
            payload: { whatsapp_number: cell },
            status: 'pending'
        })
    });

    if (!insertRes.ok) {
        const err = await insertRes.text();
        return console.log('[x] Insert Error:', err);
    }

    const q = (await insertRes.json())[0];
    console.log(`[>>] Task ${q.id} created. Invoking worker...`);

    const response = await fetch(`${supabaseUrl}/functions/v1/whatsapp-reports-worker`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
        }
    });

    const resData = await response.json();
    console.log('[DONE] Worker Response:', resData);
}

run();
