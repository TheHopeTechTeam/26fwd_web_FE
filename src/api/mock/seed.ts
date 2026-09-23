import { mulberry32 } from '../../lib/random';
import type { CardStatus } from '../types';

/** A row as the mock "database" stores it (mirrors D1 forward_cards minus ip_hash). */
export interface StoredCard {
  id: string;
  nickname: string;
  text_gratitude: string;
  text_anticipate: string;
  status: CardStatus;
  created_at: string;
}

// All content below is synthetic test data (DATA-05: the seed_ prefix marks it).
const NICKNAMES = [
  '小恩', 'Grace', '阿哲', '雅婷', 'Joshua', '小米', '佩佩', 'Daniel', '思妤', '阿凱',
  'Esther', '家豪', '小魚', 'Hannah', '志明', '以琳', 'Ruth', '阿澤', '米亞', 'Caleb',
  '詩涵', '大衛', '晨晨', 'Sarah', '柏宇', '小羊', 'Joy', '佳佳', 'Timothy', '安安',
];

const GRATITUDE = [
  '這一年在低谷裡沒有放開我的手。',
  '讓我在小組裡找到願意一起哭、一起笑的家人。',
  '爸爸的手術很順利，全家一起經歷了祢的保守。',
  '我終於鼓起勇氣受洗了！謝謝一路陪伴我的每一個人。',
  '每週日的敬拜，都讓疲憊的我重新得力。',
  '在換工作的空窗期，祢的供應從來沒有遲到。',
  '讓我從一個只會坐在最後一排的人，變成願意在門口迎接新朋友的人。',
  '透過 Online 聚會，住在國外的我也能每週和教會一起敬拜。',
  '孩子在兒童主日學裡學會了自己禱告。',
  'Hope Week 服事時，看見社區長輩的笑容，我知道祢也在那裡。',
  '祢的恩典夠我用。',
  '謝謝祢在我最想放棄的時候，派了一個朋友傳訊息問我：「最近還好嗎？」那一句話把我從很深的地方拉了回來。',
  '考試失利那天，我學會了原來我的價值不是分數決定的。',
  '讓我和家人的關係慢慢修復，雖然還在路上，但我看見了盼望。',
  '七年前第一次走進 The Hope，是被朋友硬拉來的；現在我也開始拉別人來了。',
  '每一次禱告會，都提醒我：我們不是一個人在走。',
  '謝謝祢讓我在宣教旅程中，看見世界比我想像的更大，祢的愛也是。',
  '今年學會了安息，不再用忙碌證明自己。',
  '感謝神！',
  '謝謝祢透過一堂課程，讓我重新認識聖經不是規條，而是祢寫給我的情書。',
  '在離開家鄉工作的第一年，教會成為我在台北的家。',
  '為每一個在背後默默服事的同工感謝祢，你們的擺上被看見了。',
  '謝謝祢讓我在焦慮的夜晚仍然可以安睡。',
  '感謝神在過去七年，一次又一次證明祢是信實的。從一間小小的聚會場地到今天，每一步都有祢的腳蹤，每一個轉角都有祢預備的人。',
];

const ANTICIPATE = [
  '明年可以帶我的室友來教會。',
  '新的聚會空間能容納更多還沒認識祢的人。',
  '我們的小組可以開出第二個小組！',
  '期待在職場上活出光和鹽的樣子。',
  '我的家人有一天也能認識祢。',
  '明年可以參加短宣，親眼看見祢在其他國家的作為。',
  '自己更勇敢，不再因為害怕而錯過祢給的機會。',
  '在 Online 認識的朋友，有一天能在實體聚會擁抱。',
  '孩子在信仰裡長大，成為有愛、有盼望的人。',
  'There is more——祢要做的，永遠比我們想的更多。',
  '每一個走進教會的人都能感覺到：這裡有家。',
  '更深地認識祢，不只是知道祢，而是天天與祢同行，在平凡的日子裡也聽見祢的聲音。',
  'Hope Week 能走進更多社區，把盼望帶到需要的角落。',
  '我們這一代，可以為下一代預備更寬廣的空間。',
  '明年受洗！',
  '和祢一起寫下新的篇章。',
  '身體的醫治，也期待心裡的平安。',
  '成為別人的祝福，而不只是等待祝福的人。',
  '教會在網路上的每一次直播，都能成為某個人生命轉折的開始。',
  '我們一起往前走，一步也不落下任何一個人。',
  '看見祢在這座城市做新事。',
  '學會更慷慨地給予，因為祢先慷慨地給了我。',
  '更多年輕人被興起，在各個領域發光。',
  '有一天能回頭看，說：原來這一路都是祢。',
];

const HOUR = 3600 * 1000;

export function createSeedCards(now: number, approvedCount = 50): StoredCard[] {
  const rand = mulberry32(2026);
  const pick = <T,>(list: readonly T[], i: number, stride: number) => list[(i * stride) % list.length] as T;
  const cards: StoredCard[] = [];

  let cursor = now - 1.5 * HOUR;
  for (let i = 0; i < approvedCount; i++) {
    cursor -= (2 + rand() * 9) * HOUR;
    cards.push({
      id: `seed_${String(i + 1).padStart(3, '0')}`,
      nickname: pick(NICKNAMES, i, 7),
      text_gratitude: pick(GRATITUDE, i, 5),
      text_anticipate: pick(ANTICIPATE, i, 11),
      status: 'approved',
      created_at: new Date(cursor).toISOString(),
    });
  }

  const pending: Array<[string, string, string]> = [
    ['晨光', '謝謝祢讓我在新的城市很快找到教會。', '期待下個月的受洗班！'],
    ['Mia', '感謝神讓我考上研究所。', '期待在實驗室裡也能成為同學的祝福。'],
    ['小羊', '謝謝教會的大家在我住院時輪流來探望。', '期待身體完全康復，回到服事崗位。'],
    ['測試帳號', '感謝神！有需要一起禱告的可以加我 LINE：fwd_demo_000', '期待更多人認識祢。'],
    ['阿光', '感謝神讓我今年學會了感恩。', '期待明年繼續成長。'],
    ['Nora', '謝謝祢讓我在 Online 聚會認識了一群好朋友。', '期待年底一起去實體聚會。'],
  ];
  pending.forEach(([nickname, text_gratitude, text_anticipate], i) => {
    cards.push({
      id: `seed_p${String(i + 1).padStart(2, '0')}`,
      nickname,
      text_gratitude,
      text_anticipate,
      status: 'pending',
      created_at: new Date(now - (i * 47 + 12) * 60 * 1000).toISOString(),
    });
  });

  const hidden: Array<[string, string, string]> = [
    ['優惠小幫手', '限時優惠！點擊連結領取免費贈品（合成垃圾訊息範例）', '限時優惠（合成垃圾訊息範例）'],
    ['路人', 'test', 'test'],
    ['重複投稿', '感謝神！', '感謝神！'],
  ];
  hidden.forEach(([nickname, text_gratitude, text_anticipate], i) => {
    cards.push({
      id: `seed_h${String(i + 1).padStart(2, '0')}`,
      nickname,
      text_gratitude,
      text_anticipate,
      status: 'hidden',
      created_at: new Date(now - (i + 2) * 26 * HOUR).toISOString(),
    });
  });

  return cards;
}
