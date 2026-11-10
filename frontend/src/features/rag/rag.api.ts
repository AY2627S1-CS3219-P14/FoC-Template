export type RagAnswer = { answer: string }

function apiUrl() {
  return import.meta.env.VITE_RAG_API_URL ?? 'http://localhost:8003'
}

export async function askRag(question: string, signal?: AbortSignal): Promise<RagAnswer> {
  const response = await fetch(`${apiUrl()}/query`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: question, top_k: 5 }),
    signal,
  })

  if (!response.ok) throw new Error('The assistant is unavailable right now.')
  return response.json() as Promise<RagAnswer>
}
