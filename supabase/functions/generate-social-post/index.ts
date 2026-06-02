import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_MODELS = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
]

async function callGemini(prompt: string): Promise<string> {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

    for (const model of GEMINI_MODELS) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), 30000)

            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.9,
                        maxOutputTokens: 4096,
                    }
                })
            })
            clearTimeout(timeout)

            const data = await res.json()
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) return text
            console.warn(`Model ${model} returned empty, trying next...`)
        } catch (err) {
            console.warn(`Model ${model} failed: ${err.message}`)
        }
    }
    throw new Error('All Gemini models failed')
}

function parseVariations(rawText: string): string[] {
    // Split on separator patterns
    const separators = [
        '---VARIAÇÃO---',
        '---VARIACAO---',
        '---Variação---',
        /---\s*VARIA[ÇC][ÃA]O\s*---/gi,
        /Variação\s*\d+\s*:/gi,
    ]

    let parts: string[] = [rawText]

    // Try string separators first
    for (const sep of separators) {
        if (typeof sep === 'string') {
            if (rawText.includes(sep)) {
                parts = rawText.split(sep)
                break
            }
        } else {
            const splits = rawText.split(sep)
            if (splits.length >= 3) {
                parts = splits
                break
            }
        }
    }

    // Clean and filter
    const variations = parts
        .map(v => v.trim())
        .filter(v => v.length > 20)
        .slice(0, 3)

    return variations.length > 0 ? variations : [rawText.trim()]
}

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { prompt, platform, postType } = await req.json()

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: 'Prompt is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Generating social post: platform=${platform}, type=${postType}`)

        const rawText = await callGemini(prompt)
        const variations = parseVariations(rawText)

        console.log(`Generated ${variations.length} variations`)

        return new Response(
            JSON.stringify({
                variations,
                model: 'gemini-2.0-flash',
                raw: rawText,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (err) {
        console.error('Error:', err.message)
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
