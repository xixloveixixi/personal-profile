import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  const { data, error } = await supabase
    .from('knowledge_vectors')
    .select('id, embedding')
    .eq('id', 'personal-info')
    .single()
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  const emb = data?.embedding
  
  return new Response(JSON.stringify({
    id: data?.id,
    type: typeof emb,
    isArray: Array.isArray(emb),
    length: emb ? (Array.isArray(emb) ? emb.length : String(emb).length) : 0,
    sample: emb ? (Array.isArray(emb) ? emb.slice(0, 3) : String(emb).substring(0, 50)) : null
  }), { headers: { 'Content-Type': 'application/json' } })
}
