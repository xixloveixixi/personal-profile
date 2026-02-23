export async function POST() {
  const apiKey = process.env.ALIBABA_API_KEY!
  const baseURL = process.env.ALIBABA_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1'
  
  const response = await fetch(`${baseURL}/services/embeddings/text-embedding/text-embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-v1',
      input: {
        texts: ['测试文本'],
      },
    }),
  })
  
  const data = await response.json()
  
  return new Response(JSON.stringify({
    rawResponse: data,
    embeddingType: typeof data.output?.embeddings?.[0]?.embedding,
    isArray: Array.isArray(data.output?.embeddings?.[0]?.embedding),
    embeddingLength: data.output?.embeddings?.[0]?.embedding?.length
  }), { headers: { 'Content-Type': 'application/json' } })
}
