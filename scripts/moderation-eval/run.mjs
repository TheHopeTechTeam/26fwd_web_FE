// Sends every card in cards.json to one Clef model through the local proxy and
// appends the raw answers to results/raw/<model>.jsonl. Cards already in that file
// are skipped, so an interrupted run can be resumed by running the same command.
//
//   npx wrangler dev --config scripts/moderation-eval/proxy/wrangler.jsonc --ip 127.0.0.1 --port 8787
//   node scripts/moderation-eval/run.mjs --model clef-flash [--ids zh-none-01,en-crisis-02] [--limit 5]
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const dir = new URL('.', import.meta.url);
const { values: args } = parseArgs({
  options: {
    model: { type: 'string' },
    ids: { type: 'string' },
    limit: { type: 'string' },
    concurrency: { type: 'string', default: '3' },
    endpoint: { type: 'string', default: 'http://127.0.0.1:8787' },
  },
});

const MODELS = { 'clef-flash': '@cf/cloudflare/clef-flash', clef: '@cf/cloudflare/clef' };
if (!MODELS[args.model]) {
  console.error('--model must be clef-flash or clef');
  process.exit(1);
}

const cards = JSON.parse(readFileSync(new URL('cards.json', dir), 'utf8'));
const questions = JSON.parse(readFileSync(new URL('questions.json', dir), 'utf8'));

mkdirSync(new URL('results/raw/', dir), { recursive: true });
const outFile = new URL(`results/raw/${args.model}.jsonl`, dir);
const done = new Set(
  existsSync(outFile)
    ? readFileSync(outFile, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line)).filter((r) => r.ok).map((r) => r.id)
    : [],
);

let todo = cards.filter((c) => !done.has(c.id));
if (args.ids) {
  const wanted = new Set(args.ids.split(','));
  todo = todo.filter((c) => wanted.has(c.id));
}
if (args.limit) todo = todo.slice(0, Number(args.limit));
console.log(`${args.model}: ${done.size} already done, ${todo.length} to run`);

// The model sees exactly the fields a real submission stores, nothing from the label.
const inputFor = (card) => ({
  model: args.model,
  state: {
    nickname: card.card.nickname,
    text_gratitude: card.card.text_gratitude,
    text_anticipate: card.card.text_anticipate,
  },
  questions,
});

async function call(card) {
  for (let attempt = 1; ; attempt++) {
    const started = Date.now();
    try {
      const response = await fetch(args.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: MODELS[args.model], input: inputFor(card) }),
      });
      const body = await response.json();
      if (body.ok || attempt >= 3) return { ...body, attempt, wall_ms: Date.now() - started };
    } catch (error) {
      if (attempt >= 3) return { ok: false, error: String(error), attempt, wall_ms: Date.now() - started };
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
  }
}

let next = 0;
let failed = 0;
async function worker() {
  while (next < todo.length) {
    const card = todo[next++];
    const result = await call(card);
    appendFileSync(outFile, JSON.stringify({ id: card.id, model: args.model, at: new Date().toISOString(), ...result }) + '\n');
    if (!result.ok) failed++;
    console.log(`${result.ok ? 'ok  ' : 'FAIL'} ${card.id} ${result.ms ?? '-'}ms${result.ok ? '' : ` ${result.error}`}`);
  }
}
await Promise.all(Array.from({ length: Number(args.concurrency) }, worker));
console.log(`finished: ${todo.length - failed} ok, ${failed} failed`);
process.exit(failed ? 1 : 0);
