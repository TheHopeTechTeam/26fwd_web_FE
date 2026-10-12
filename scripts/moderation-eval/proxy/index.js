// Forwards one model call from run.mjs to Workers AI and reports how long it took.
// Latency measured here includes the hop from this machine to Cloudflare, so it is
// only useful for comparing the two models, not as a production number.
const MODELS = new Set(['@cf/cloudflare/clef-flash', '@cf/cloudflare/clef']);

export default {
  async fetch(request, env) {
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
