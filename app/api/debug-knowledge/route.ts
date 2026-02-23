import { hybridSearch } from '@/lib/ai/hybrid-search'

export async function POST(req: Request) {
  const { query } = await req.json()
  
  console.log('Debug search query:', query)
  
  const results = await hybridSearch(query, 5)
  
  return new Response(JSON.stringify({
    query,
    resultCount: results.length,
    results: results.map(r => ({
      similarity: r.similarity,
      metadata: r.metadata,
      contentPreview: r.content.substring(0, 200)
    }))
  }), { headers: { 'Content-Type': 'application/json' } })
}
