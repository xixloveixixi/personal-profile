import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST() {
  const { error } = await supabase
    .from('knowledge_vectors')
    .delete()
    .neq('id', 'placeholder') // 删除所有记录
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  return new Response(JSON.stringify({ success: true, message: '所有知识库数据已清空' }), 
    { headers: { 'Content-Type': 'application/json' } })
}
