// Forwards one model call from run.mjs to Workers AI and reports how long it took.
// Latency measured here includes the hop from this machine to Cloudflare, so it is
// only useful for comparing models, not as a production number.
//
// Only run.mjs on this machine may use it; anyone else could spend the account's Workers AI
// allowance through it (#29 review):
// - requests addressed to another host are refused (a mistaken deploy, DNS rebinding), and
//   wrangler.jsonc turns off the workers.dev address;
// - anything a browser sends is refused: browsers mark requests from web pages with Origin or
//   Sec-Fetch-Site, and a page cannot add the tool header below to a cross-site request without
//   a CORS preflight, which this Worker never approves.
const MODELS = new Set(['@cf/cloudflare/clef-flash', '@cf/cloudflare/clef']);
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);
const TOOL_HEADER = 'X-FWD-Eval-Tool';

function fromLocalTool(request) {
  if (!LOCAL_HOSTS.has(new URL(request.url).hostname)) return false;
  if (request.headers.has('Origin') || request.headers.has('Sec-Fetch-Site')) return false;
  if (request.headers.get(TOOL_HEADER) !== 'run.mjs') return false;
  return request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() === 'application/json';
}

export default {
  async fetch(request, env) {
    if (!fromLocalTool(request)) return new Response('local evaluation tool only', { status: 403 });
    if (request.method !== 'POST') return new Response('POST only', { status: 405 });
    const { model, input } = await request.json();
    if (!MODELS.has(model)) return Response.json({ ok: false, error: `unknown model ${model}` }, { status: 400 });
    const started = Date.now();
    try {
      const output = await env.AI.run(model, input);
      return Response.json({ ok: true, ms: Date.now() - started, output });
    } catch (error) {
      return Response.json({ ok: false, ms: Date.now() - started, error: String(error?.message ?? error) }, { status: 502 });
    }
  },
};
