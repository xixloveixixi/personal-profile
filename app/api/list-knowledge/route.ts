import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET() {
  const { data, error } = await supabase
    .from('knowledge_vectors')
    .select('id, metadata, content')
    .limit(20)
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  return new Response(JSON.stringify({
    count: data?.length || 0,
    items: data?.map(d => ({
      id: d.id,
      type: d.metadata?.type,
      title: d.metadata?.title
    }))
  }), { headers: { 'Content-Type': 'application/json' } })
}
