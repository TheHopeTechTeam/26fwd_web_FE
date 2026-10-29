/**
 * Page copy and section data. All wording and numbers are PLACEHOLDERS until COMMS
 * delivers the final 01–05 copy, statistics and music choices (see the spec's ⑤ 時程).
 * Keep content edits here rather than in the components.
 */

export type ChapterId = 'appreciate' | 'anticipate' | 'respond';

export interface Chapter {
  id: ChapterId;
  index: string;
  en: string;
  zh: string;
}

/**
 * The three journey stops the right-hand rail tracks (US-01, #17). The separate Transition
 * stop is gone; English names stay until BB／Ian confirm the Chinese ones.
 */
export const CHAPTERS: Chapter[] = [
  { id: 'appreciate', index: '01', en: 'Appreciate', zh: '感謝' },
  { id: 'anticipate', index: '02', en: 'Anticipate', zh: '期待' },
  { id: 'respond', index: '03', en: 'Respond', zh: '回應' },
];

/**
 * Hero copy (#26). On desktop the title is baked into the KV, so `title` and the series line
 * are read by screen readers only; on phones they are the visible title. The date is live
 * text, never burned into the image (#26 A-2: 活動起始日 11/14).
 */
export const HERO = {
  title: 'THERE IS MORE',
  series: '2026 FORWARD',
  zh: '系列講道',
  date: '11/14 起',
  lead: '感謝神過去七年的信實，一起期待祂要成就的更多。',
  cta: '開始旅程',
};

export const APPRECIATE = {
  title: '神的信實，寫在每一張臉上',
  lead: '七年來，神在一個又一個生命裡留下記號。點開任何一張臉，讀一段故事。',
  note: '示意人物為合成插畫與虛構故事（synthetic），正式見證素材與授權待 Online Campus 交付。',
};

export interface Track {
  title: string;
  artist: string;
  src: string;
  sourceUrl: string;
  license: string;
}

/**
 * Site-wide background music behind the header toggle (#17 interim; GLB-02). Until #25 picks
 * the songs and how they change by chapter, it plays one test track and never autoplays.
 */
export const MUSIC: { track: Track; note: string } = {
  track: {
    title: 'Still Waters',
    artist: 'FORWARD Synth Lab（測試音訊）',
    src: 'audio/still-waters.m4a',
    // Resolved against the deploy base, so it works on every preview URL.
    sourceUrl: 'audio/ATTRIBUTION.md',
    license: 'CC0（本專案自製）',
  },
  note: '測試音樂為本專案自製的合成曲目，正式選曲與授權待 COMMS 確認。',
};

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

/** Ministry JSON shape agreed for US-06; `art` picks the placeholder illustration. */
export interface Ministry {
  id: string;
  index: string;
  zh: string;
  en: string;
  headline: string;
  body: string;
  /** Empty until approved figures exist; the block then shows `pendingNote` instead. */
  stats: Stat[];
  /** Replaces the synthetic-stats note for an item whose figures are still pending. */
  pendingNote?: string;
  art: 'building' | 'missions' | 'outreach' | 'online' | 'cities';
}

export const ANTICIPATE = {
  title: '神要帶我們去的地方',
  lead: '五項事工，是我們一起期待、也一起預備的未來。',
  statsNote: '示意數據，正式數字與統計口徑待 COMMS 交付。',
  artNote: '圖像待 COMMS 交付',
};

export const MINISTRIES: Ministry[] = [
  {
    id: 'building',
    index: '01',
    zh: '建堂',
    en: 'Building',
    headline: '為更多生命預備空間',
    body: '七年來，我們在借來與租來的場地裡敬拜。接下來，我們期待一個能承接更多生命的家——讓週間的小組、孩子的主日學與社區服事都有屬於它的位置。每一筆奉獻的使用都會公開透明地交代。',
    stats: [
      { value: 1200, suffix: '+', label: '每週聚會人次' },
      { value: 24, label: '週間小組據點' },
    ],
    art: 'building',
  },
  {
    id: 'missions',
    index: '02',
    zh: '宣教資助',
    en: 'Missions & Donations',
    headline: '把福音帶到更遠的地方',
    body: '我們與長期宣教夥伴同行，支持他們在各地的服事與生活，也差派短宣隊實地參與。所有資助項目與使用方式都會定期向會眾報告。',
    stats: [
      { value: 3, suffix: ' 個', label: '長期宣教夥伴' },
      { value: 40, suffix: '+', label: '短宣隊員' },
    ],
    art: 'missions',
  },
  {
    id: 'outreach',
    index: '03',
    zh: '外展與憐憫事工',
    en: 'Outreach & Hope Week',
    headline: '走進社區，成為好鄰舍',
    body: '透過 Hope Week 與日常的外展服事，我們走進社區陪伴長輩、關心弱勢家庭、支持在地學校。教會存在，是為了成為城市的祝福。',
    stats: [
      { value: 1200, suffix: '+', label: '服事人次' },
      { value: 86, label: '合作據點' },
      { value: 340, suffix: '+', label: '志工' },
    ],
    art: 'outreach',
  },
  {
    id: 'online',
    index: '04',
    zh: '網路宣教',
    en: 'Online Ministry',
    headline: '跨越距離的教會',
    body: '不論在哪個城市、哪個時區，Online Campus 讓更多人能一起敬拜、加入線上小組、被牧養與陪伴。下一步，我們期待觸及更多還沒有教會的人。',
    stats: [
      { value: 520, suffix: '+', label: '每週線上參與' },
      { value: 74, label: '觸及城市' },
      { value: 1800, suffix: '+', label: '線上小組成員' },
    ],
    art: 'online',
  },
  /*
   * The fifth ministry (#18). Name is provisional and nothing here is invented: copy,
   * figures and imagery all wait for Comms. The online item's 「觸及城市」 is a
   * different figure and must not stand in for this one.
   */
  {
    id: 'cities',
    index: '05',
    zh: '其他城市分布',
    en: 'Other Cities',
    headline: '標題待 COMMS 提供',
    body: '其他城市分布的介紹文字、照片與數據，待 COMMS 提供後替換（名稱為暫稱）。',
    stats: [],
    pendingNote: '城市數據待 COMMS 交付。',
    art: 'cities',
  },
];

/**
 * Low-key Prayer Map link after the Give finale (#19, US-11). Wording and URL await
 * BB / Comms / Ian; nothing from this site is sent along (no query, no referrer).
 */
export const PRAYER_LINK = {
  lead: '也想為城市與彼此禱告？',
  label: '前往 Prayer Map 代禱',
};

export const RESPOND = {
  title: 'Write it forward',
  lead: '寫下一張屬於你的 Forward Card：一句感謝，一個期待。做好的卡片可以下載保存，也可以選擇公開到卡片牆，與全 Hope Nation 分享。',
};

export const FINALE = {
  kicker: 'FORWARD 2026 · GIVE',
  title: ['There is', 'more'],
  body: '透過奉獻，一起為神接下來要成就的事預備空間。你的每一份擺上，都會成為建堂、宣教、外展與網路宣教往前的一步。',
  cta: '參與 FORWARD 奉獻',
  disabled: '奉獻連結設定中，正式開放後即可使用。',
};
