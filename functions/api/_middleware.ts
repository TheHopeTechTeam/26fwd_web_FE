import { LOAD_TEST_HOSTNAME, loadTestActive, type Env } from '../_lib/cards'

type Context = { request: Request; env: Env; next: () => Promise<Response> }

// Marks every API response while the staging load-test mode is on, and logs each request so the
// window can be checked afterwards. If the variable is set anywhere else it has no effect, and
// each request logs an error so the stray setting gets noticed.
export async function onRequest({ request, env, next }: Context): Promise<Response> {
  const response = await next()
  if (env.LOAD_TEST_MODE !== 'true') return response
  const { hostname, pathname } = new URL(request.url)
  if (!loadTestActive(request, env)) {
    console.error(`LOAD_TEST_MODE is set but ignored on ${hostname}; only ${LOAD_TEST_HOSTNAME} honours it`)
    return response
  }
  console.warn(`LOAD_TEST_MODE on: ${request.method} ${pathname}`)
  const marked = new Response(response.body, response)
  marked.headers.set('X-FWD-Load-Test', 'on')
  return marked
}
