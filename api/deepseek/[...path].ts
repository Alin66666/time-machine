export const config = {
  runtime: 'edge',
}

// Vercel Edge Function — proxies requests to DeepSeek API
// If the client provides an API key, use it. Otherwise, use the server's key.
export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname.replace('/api/deepseek', '')
  const deepseekUrl = `https://api.deepseek.com${path}${url.search}`

  // Clone request headers, removing host
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === 'host') return
    if (lower === 'content-length') return
    headers.set(key, value)
  })

  // If client didn't provide an API key, inject the server's default
  const authHeader = headers.get('Authorization') || ''
  if (!authHeader || authHeader === 'Bearer ' || authHeader === 'Bearer') {
    const serverKey = process.env.DEEPSEEK_API_KEY
    if (serverKey) {
      headers.set('Authorization', `Bearer ${serverKey}`)
    }
  }

  const response = await fetch(deepseekUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  })

  // Return the response, adding CORS headers
  const corsHeaders = new Headers(response.headers)
  corsHeaders.set('Access-Control-Allow-Origin', '*')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: corsHeaders,
  })
}
