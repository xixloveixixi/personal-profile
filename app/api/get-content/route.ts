import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
  const { id } = await req.json()
  
  const { data, error } = await supabase
    .from('knowledge_vectors')
    .select('id, metadata, content')
    .eq('id', id)
    .single()
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  return new Response(JSON.stringify({
    id: data?.id,
    type: data?.metadata?.type,
    content: data?.content
  }), { headers: { 'Content-Type': 'application/json' } })
}
