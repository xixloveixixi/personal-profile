import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  const { data, error } = await supabase
    .from('knowledge_vectors')
    .select('id, embedding')
    .eq('id', 'timeline-info-0')
    .single()
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  return new Response(JSON.stringify({
    id: data?.id,
    embeddingLength: data?.embedding ? data.embedding.length : 0,
    embeddingSample: data?.embedding ? data.embedding.slice(0, 5) : null
  }), { headers: { 'Content-Type': 'application/json' } })
}
