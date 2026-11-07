import { describe, expect, it } from 'vitest';
import { deleteConfirmed } from './confirm';

describe('deleteConfirmed: a delete needs 「刪除」 typed out (#35)', () => {
  it('accepts the word, also with spaces around it', () => {
    for (const typed of ['刪除', ' 刪除 ', '　刪除　']) expect(deleteConfirmed(typed), typed).toBe(true);
  });

  it('refuses anything else', () => {
    for (const typed of ['', '刪', '删除', '刪 除', '刪除！', 'delete', '確認']) expect(deleteConfirmed(typed), typed).toBe(false);
  });
});
