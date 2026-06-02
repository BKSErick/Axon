// Upload images to Supabase Storage via REST API
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://whcfgflswdanptxsvfes.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2ZnZmxzd2RhbnB0eHN2ZmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NTA2ODksImV4cCI6MjA1NjQyNjY4OX0.j07m_1fOE8tD4rw4VPvuhVAKEQJq0WGeMmCXfxvhHIM';
const BUCKET = 'apresentacao';

const BRAIN_DIR = 'C:\\Users\\RobsoNobre\\.gemini\\antigravity\\brain\\648b53df-d688-402b-a48a-47d91a00ea4e';

const files = [
    'doc_step1_visao_geral_1773582746203.png',
    'doc_step2_modo_manual_1773582765199.png',
    'doc_step3_fila_1773582783399.png',
    'doc_step4_upload_1773582823342.png',
    'doc_step5_briefing_1773582841992.png',
    'step1_criar_post_ia_1773582558581.png',
    'step3_modo_manual_1773582604323.png',
    'step4_texto_manual_1773582618064.png',
    'step5_fila_1773582627060.png',
    'step6_publicados_1773582641401.png',
    'step7_perfis_ia_1773582651286.png',
    'step8_briefing_ia_1773582667587.png',
    'step9_upload_zone_1773582676189.png',
];

async function upload() {
    for (const fileName of files) {
        const filePath = path.join(BRAIN_DIR, fileName);
        if (!fs.existsSync(filePath)) {
            console.log(`❌ Not found: ${fileName}`);
            continue;
        }
        const fileBuffer = fs.readFileSync(filePath);
        
        try {
            const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ANON_KEY}`,
                    'apikey': ANON_KEY,
                    'Content-Type': 'image/png',
                    'x-upsert': 'true',
                },
                body: fileBuffer,
            });
            
            if (res.ok) {
                console.log(`✅ ${fileName} → ${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`);
            } else {
                const err = await res.text();
                console.log(`❌ ${fileName}: ${res.status} ${err}`);
            }
        } catch (e) {
            console.log(`❌ ${fileName}: ${e.message}`);
        }
    }
}

upload();
