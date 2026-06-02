import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META = 'https://graph.facebook.com/v21.0'

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { client_id } = await req.json()

        if (!client_id) throw new Error('client_id is required')

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )
        const token = Deno.env.get('META_API_TOKEN')
        if (!token) throw new Error('META_API_TOKEN not configured')

        // Resolve profile -> client_id if needed
        let resolvedClientId = client_id
        const { data: profile } = await supabase
            .from('profiles').select('client_id').eq('id', client_id).single()
        if (profile?.client_id) resolvedClientId = profile.client_id

        // Fetch ad accounts for this client
        const { data: adAccounts } = await supabase
            .from('ad_accounts')
            .select('meta_id, name')
            .eq('client_id', resolvedClientId)

        if (!adAccounts || adAccounts.length === 0) {
            return new Response(JSON.stringify({ accounts: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Query Meta API for balance and status of each account
        const accountResults = await Promise.allSettled(
            adAccounts.map(async (acc) => {
                // Normalize meta_id: strip any leading 'act_' to avoid double prefix
                const rawId = acc.meta_id.replace(/^act_/i, '')
                const fields = 'balance,amount_spent,currency,account_status,disable_reason,name'
                const url = `${META}/act_${rawId}?fields=${fields}&access_token=${token}`

                const controller = new AbortController()
                const tid = setTimeout(() => controller.abort(), 8000)

                try {
                    const res = await fetch(url, { signal: controller.signal })
                    clearTimeout(tid)
                    const data = await res.json()

                    if (data.error) {
                        console.error(`Meta API error for ${acc.meta_id}:`, data.error.message)
                        return { meta_id: acc.meta_id, name: acc.name, error: data.error.message }
                    }

                    // balance is in cents of the currency (e.g. BRL cents)
                    const balanceCents = Number(data.balance || 0)
                    const balanceValue = balanceCents / 100
                    const currency = data.currency || 'BRL'
                    const status = Number(data.account_status)

                    // account_status: 1=ACTIVE, 2=DISABLED, 3=UNSETTLED(no funds), 7=PENDING_RISK_REVIEW
                    // 9=IN_GRACE_PERIOD, 100=PENDING_CLOSURE, 101=CLOSED, 201=ANY_ACTIVE, 202=ANY_CLOSED
                    const isEmpty = status === 3 || balanceCents <= 0
                    const isLow = !isEmpty && balanceCents < 5000 // Less than R$ 50 (5000 cents)
                    const isDisabled = status === 2 || status === 101

                    return {
                        meta_id: acc.meta_id,
                        name: acc.name || data.name,
                        balance: balanceValue,
                        balanceCents,
                        currency,
                        status,
                        isEmpty,
                        isLow,
                        isDisabled,
                        amountSpent: Number(data.amount_spent || 0) / 100,
                    }
                } catch (e: any) {
                    clearTimeout(tid)
                    return { meta_id: acc.meta_id, name: acc.name, error: e.message }
                }
            })
        )

        const accounts = accountResults
            .filter(r => r.status === 'fulfilled')
            .map((r: any) => r.value)

        return new Response(JSON.stringify({ accounts }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (err: any) {
        console.error('check-ad-credit error:', err)
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
