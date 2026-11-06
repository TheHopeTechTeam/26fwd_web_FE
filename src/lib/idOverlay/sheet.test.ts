import { describe, expect, it } from 'vitest';
import { parseCsv, rowsFromCsv } from './sheet';

describe('rowsFromCsv', () => {
  it('reads quoted multi-line cells and keeps the 想改成 / 狀態 columns', () => {
    const csv = ',標題列\r\n優先序,編號,頁面,區段,出現方式,位置,目前文字,想改成（請填）,填寫人,狀態,備註\r\n1,9,首頁,封面 Hero,打開就看得到,引言,"第一行，\n第二行",\"他說 \"\"好\"\"\",BB,已更新,\r\n1,x,首頁,壞列,a,b,c,d,e,f,g\r\n1,10,未知頁,壞頁,a,b,c,d,e,f,g\r\n';
    const rows = rowsFromCsv(parseCsv(csv));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 9, page: 'home', text: '第一行，\n第二行', next: '他說 "好"', who: 'BB', status: '已更新' });
  });
});
