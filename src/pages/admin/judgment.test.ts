import { describe, expect, it } from 'vitest';
import type { AdminModeration } from '../../api';
import { describeJudgment, percent } from './judgment';

const judged = (fields: Partial<AdminModeration>): AdminModeration => ({
  model: '@cf/cloudflare/clef',
  questions_version: 'abcdef123456',
  outcome: 'clear',
  reason: 'none',
  reason_probability: 0.97,
  needs_attention_probability: 0.04,
  auto_published: false,
  judged_at: '2026-11-14T12:00:02.000Z',
  ...fields,
});

describe('describeJudgment: what the review console says about the AI (Ian 10/15, condition 4)', () => {
  it('marks a card the AI published, on every tab, whatever happened to it later', () => {
    for (const status of ['approved', 'hidden', 'pending'] as const) {
      expect(describeJudgment(judged({ auto_published: true }), status)).toMatchObject({ tone: 'auto', label: 'AI 自動公開' });
    }
  });

  it('a published card the AI did not publish was approved by a reviewer', () => {
    for (const moderation of [null, judged({}), judged({ outcome: 'flagged', reason: 'flag_a' }), judged({ outcome: 'timeout', reason: null })]) {
      expect(describeJudgment(moderation, 'approved').note.startsWith('由審核者核准公開。')).toBe(true);
      expect(describeJudgment(moderation, 'pending').note).not.toContain('審核者核准');
    }
  });

  it('a card without a judgment says so', () => {
    expect(describeJudgment(null, 'pending')).toMatchObject({ tone: 'none', label: '沒有 AI 判斷' });
    expect(describeJudgment(undefined, 'hidden').tone).toBe('none');
  });

  it('a held card shows the reason code as the model gave it, with its probability', () => {
    expect(describeJudgment(judged({ outcome: 'flagged', reason: 'flag_a', reason_probability: 0.875 }), 'pending')).toMatchObject({
      tone: 'flagged',
      label: 'AI：需要人工確認（flag_a，88%）',
    });
    expect(describeJudgment(judged({ outcome: 'flagged', reason: null, reason_probability: null }), 'pending').label).toBe('AI：需要人工確認（沒有理由代碼）');
  });

  it('a judgment with no usable answer names what went wrong', () => {
    const labels = (['questions_missing', 'timeout', 'model_error', 'invalid_output'] as const).map(
      (outcome) => describeJudgment(judged({ outcome, reason: null, reason_probability: null }), 'pending'),
    );
    expect(labels.map((view) => view.tone)).toEqual(['failed', 'failed', 'failed', 'failed']);
    expect(labels.map((view) => view.label)).toEqual(['AI：沒有結果（題目沒有設定）', 'AI：沒有結果（逾時）', 'AI：沒有結果（AI 服務錯誤）', 'AI：沒有結果（回答無法解讀）']);
  });

  it('a clear judgment that did not publish the card is told apart from an auto-published one', () => {
    expect(describeJudgment(judged({ outcome: 'clear' }), 'pending')).toMatchObject({ tone: 'clear', label: 'AI：沒有疑慮' });
  });

  it('percent rounds to a whole number', () => {
    expect([percent(0.04), percent(0.875), percent(1)]).toEqual(['4%', '88%', '100%']);
  });
});
