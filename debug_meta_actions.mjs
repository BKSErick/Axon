// Debug script to inspect raw Meta API action types at campaign level
const TOKEN = 'EAAdqdx9GvPIBQ9lE7xLA35di4CjYz0kWnTNcOqPVZBfYk2TSxKUKvfHYjslm8ZAQ7TC4ys8QBcOpor9KDWGu47UnRHq0jf2vN4oV9nVNZBhOnmzCA46hRWOKgueZBrF99EhcgTPRN4Y2VzqdwP5VZBb0XkBM8hJpMWTZC4zZAJCL4WK0cgsLpNkUHiAOli8ZBgZDZD';
const BASE = 'https://graph.facebook.com/v18.0';
const ACCOUNT = 'act_41185140'; // GT House from the screenshot

async function main() {
    // 1. Fetch campaigns with actions
    console.log('=== CAMPAIGNS WITH ACTIONS ===');
    const campUrl = `${BASE}/${ACCOUNT}/campaigns?fields=name,id,status,objective,insights{spend,actions,clicks,ctr,cpc}&date_preset=this_month&access_token=${TOKEN}`;
    const campRes = await fetch(campUrl);
    const campData = await campRes.json();

    if (campData.error) {
        console.error('API Error:', campData.error.message);
        return;
    }

    for (const c of (campData.data || [])) {
        const insights = c.insights?.data?.[0] || {};
        console.log(`\n--- Campaign: ${c.name} (${c.id}) ---`);
        console.log(`  Status: ${c.status}, Objective: ${c.objective}`);
        console.log(`  Spend: ${insights.spend || 0}`);
        console.log(`  Actions:`, JSON.stringify(insights.actions || [], null, 2));
    }

    // 2. Fetch account-level insights to compare
    console.log('\n\n=== ACCOUNT-LEVEL INSIGHTS ===');
    const accUrl = `${BASE}/${ACCOUNT}/insights?fields=spend,actions&date_preset=this_month&access_token=${TOKEN}`;
    const accRes = await fetch(accUrl);
    const accData = await accRes.json();
    const accInsights = accData.data?.[0] || {};
    console.log('Spend:', accInsights.spend);
    console.log('All action types:', JSON.stringify((accInsights.actions || []).map(a => ({ type: a.action_type, value: a.value })), null, 2));
}

main().catch(console.error);
