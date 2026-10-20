// Forwards one model call from run.mjs to Workers AI and reports how long it took.
// Latency measured here includes the hop from this machine to Cloudflare, so it is
// only useful for comparing models, not as a production number.
//
// Local only. If it were ever deployed by mistake, anyone could spend the account's Workers AI
// allowance through it, so it refuses every request that is not addressed to this machine, and
// wrangler.jsonc turns off the workers.dev address.
const MODELS = new Set(['@cf/cloudflare/clef-flash', '@cf/cloudflare/clef']);
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost']);

export default {
  async fetch(request, env) {
    if (!LOCAL_HOSTS.has(new URL(request.url).hostname)) return new Response('local use only', { status: 403 });
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
