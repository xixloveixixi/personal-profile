import { generateEmbedding } from '@/lib/ai/vector-store'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()
    const embedding = await generateEmbedding(text)
    return new Response(JSON.stringify({
      text,
      embeddingLength: embedding.length,
      embeddingSample: embedding.slice(0, 5)
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
