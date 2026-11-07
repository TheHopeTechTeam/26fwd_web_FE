import { describe, expect, it } from 'vitest';
import { classifyNext, compareChange, compareRemoval } from './compare';

describe('classifyNext', () => {
  it('reads what the 想改成 cell asks for', () => {
    expect(classifyNext('  ')).toBe('none');
    expect(classifyNext('ok')).toBe('keep');
    expect(classifyNext('刪除')).toBe('remove');
    expect(classifyNext('需要 comms input')).toBe('waiting');
    expect(classifyNext('教會，就是一張張尋求神的臉。')).toBe('change');
  });
});

describe('compareChange', () => {
  it('ignores punctuation and spacing differences between sheet and page', () => {
    const page = '01 · Appreciate 2026, 我感謝神…';
    expect(compareChange('01 Appreciate 2026 我感謝神... ', page).state).toBe('applied');
  });

  it('reports a half-applied edit with the clauses still missing', () => {
    const page = '走出教會與機構合作，建立長久關懷陪伴的關係。';
    const v = compareChange('走出教會與機構合作，不只是完成一次服事，而是願意走近一個人、一個家庭、一個社區，建立長久關懷陪伴的愛的關係。', page);
    expect(v.state).toBe('partial');
    expect(v.missing).toContain('不只是完成一次服事');
  });

  it('flags text that is not on the page at all', () => {
    const v = compareChange('過去四年，500+ 服事志工參與在 Hope Week 機構志工服務的外展行動', '1,200+ 服事人次 合作據點 86 志工 340+');
    expect(v.state).toBe('missing');
  });

  it('counts a figure laid out in another order as likely applied', () => {
    expect(compareChange('62 個線上小組', '線上小組 0 個 62 個').state).toBe('likely');
  });

  it('does not accept a long sentence just because its common character pairs appear', () => {
    const v = compareChange('完成後，你可以下載保存這張 FORWARD 卡，也可以分享至線上回應牆。', '完成後，這張 FORWARD 卡會分享至線上回應牆，你也可以下載保存。');
    expect(v.state).not.toBe('applied');
    expect(v.missing.length).toBeGreaterThan(0);
  });
});

describe('compareRemoval', () => {
  it('says whether the old wording is still shown', () => {
    expect(compareRemoval('只下載保存的卡片不會送出；打算公開到卡片牆的話，請留意：', '請勿留下個人資料').state).toBe('removed');
    expect(compareRemoval('只下載保存的卡片不會送出；打算公開到卡片牆的話，請留意：', '只下載保存的卡片不會送出').state).toBe('still-there');
  });

  it('catches short labels when the caller lowers the minimum clause length', () => {
    expect(compareRemoval('開始旅程', '開始旅程 ↓').state).toBe('removed');
    expect(compareRemoval('開始旅程', '開始旅程 ↓', 2).state).toBe('still-there');
    expect(compareRemoval('開始旅程', '寫下一張 FORWARD 卡', 2).state).toBe('removed');
  });
});
