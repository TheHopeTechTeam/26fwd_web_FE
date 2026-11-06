import type { AdminModeration, CardStatus } from '../../api';

/**
 * How the review console shows a card's AI judgment (M1.6), so reviewers can tell which cards the
 * AI published (Ian 10/15, condition 4). The reason is shown as the code the model gave: the codes
 * and their meaning are in the questions, an encrypted secret outside the repo.
 */
export type JudgmentTone = 'auto' | 'clear' | 'flagged' | 'failed' | 'none';
export type JudgmentView = { tone: JudgmentTone; label: string; note: string };

const NO_ANSWER: Record<string, string> = {
  questions_missing: '題目沒有設定',
  timeout: '逾時',
  model_error: 'AI 服務錯誤',
  invalid_output: '回答無法解讀',
};

export const percent = (probability: number) => `${Math.round(probability * 100)}%`;

export function describeJudgment(moderation: AdminModeration | null | undefined, status: CardStatus): JudgmentView {
  if (moderation?.auto_published) {
    return { tone: 'auto', label: 'AI 自動公開', note: 'AI 判斷沒有疑慮，直接公開，沒有經過人工審核。之後隱藏或重新公開，這個標示也不會改變。' };
  }
  // Only the model or a reviewer can publish a card, so a published card the model did not publish
  // was approved by a reviewer.
  const byReviewer = status === 'approved' ? '由審核者核准公開。' : '';
  if (!moderation) {
    return { tone: 'none', label: '沒有 AI 判斷', note: `${byReviewer}送出時自動公開是關閉的，或判斷沒有完成。` };
  }
  if (moderation.outcome === 'clear') {
    return { tone: 'clear', label: 'AI：沒有疑慮', note: `${byReviewer}判斷完成時，這張 FORWARD 卡已經被處理，或自動公開已經關閉，所以沒有自動公開。` };
  }
  if (moderation.outcome === 'flagged') {
    const p = moderation.reason_probability;
    const reason = `${moderation.reason ?? '沒有理由代碼'}${p === null ? '' : `，${percent(p)}`}`;
    return { tone: 'flagged', label: `AI：需要人工確認（${reason}）`, note: `${byReviewer}AI 認為需要人工確認，所以沒有自動公開。` };
  }
  const why = NO_ANSWER[moderation.outcome] ?? moderation.outcome;
  return { tone: 'failed', label: `AI：沒有結果（${why}）`, note: `${byReviewer}沒有可用的判斷，所以沒有自動公開。` };
}
