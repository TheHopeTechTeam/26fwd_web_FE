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
  /** Short name in the top menu. */
  zh: string;
  /** Name on the right-hand rail (BB's 網站文字表 #5, 11/04); phones show only this. */
  rail: string;
}

/**
 * The three journey stops the right-hand rail tracks (US-01, #17). The top menu keeps the
 * short `zh` names; the rail uses BB's longer `rail` names (11/04).
 */
export const CHAPTERS: Chapter[] = [
  { id: 'appreciate', index: '01', en: 'Appreciate', zh: '感謝', rail: '我感謝神…' },
  { id: 'anticipate', index: '02', en: 'Anticipate', zh: '期待', rail: '一起期待…' },
  { id: 'respond', index: '03', en: 'Respond', zh: '回應', rail: '線上 FORWARD 卡' },
];

/** The rail's last stop, after the three chapters (11/04): it jumps to the Give finale. */
export const RAIL_GIVE = { id: 'give', en: 'There is More', zh: '我要參與奉獻' } as const;

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
  // No punctuation (11/04): spaces stand in for the commas, and lines break only at them.
  lead: 'APPRECIATE 為神已經成就的獻上感謝\nANTICIPATE 憑著信心 為更多生命與教會所相信的挪出一個空間 參與在祂將要成就的未來',
  cta: '開始旅程',
};

export const APPRECIATE = {
  title: '教會，就是一張張尋求神的臉。',
  lead: '從你我的一個回應開始，踏出第一步，再下一步。\n我們聚集的地方，就是見證神正在尋找人的地方；我們所在的地方，就是福音正在發生的地方。在跟隨神的路上，讓我們經歷豐盛，也永遠別忘記我們曾對祂說過的 YES！',
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

/** Hero prompt for the same player as the header switch. */
export const HERO_MUSIC = {
  start: '開啟音樂，在敬拜中走這趟旅程',
  stop: '暫停音樂',
  hint: '也可以在右上角 ♪ 隨時開關',
  error: '音樂暫時無法播放，再試一次',
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
  /** Figures came from BB's 網站文字表 (11/04), so the synthetic-stats note is not shown. */
  statsProvided?: true;
  art: 'building' | 'missions' | 'outreach' | 'online' | 'cities';
}

export const ANTICIPATE = {
  title: 'FORWARD 是十一之外的慷慨奉獻。',
  lead: '它不只為一個場地，也不是一次性的募款，而是持續支持五大事工。\n每一份給予，都幫助教會接觸人群、帶領更多人認識耶穌，並朝著 The Hope「在我們所到的每個城市，贏得 1% 的人」的異象一起前進。',
  statsNote: '示意數據，正式數字與統計口徑待 COMMS 交付。',
  artNote: '圖像待 COMMS 交付',
};

/** One partner organisation's story under 外展憐憫事工 (#26, plan C). */
export interface OutreachPartner {
  id: string;
  /** Tab label. */
  name: string;
  /** The 【…】 line of the write-up. */
  title: string;
  /** Paragraphs separated by a blank line. */
  body: string;
}

/**
 * The partner organisations shown as tabs under 外展憐憫事工 (#26, plan C: 分頁切換, no auto
 * rotation). Names, stories and photos are still being confirmed, so these are placeholders
 * only and nothing is written for them (Ian, 11/04). The real write-ups are kept outside the
 * repo until Ian confirms they can be published. Paragraphs are separated by a blank line.
 */
export const OUTREACH_PARTNERS: OutreachPartner[] = ['01', '02', '03', '04', '05'].map((n) => ({
  id: `partner-${n}`,
  name: `合作機構 ${n}`,
  title: '機構故事標題（待提供）',
  body: '機構名稱、故事與照片待 COMMS 提供。',
}));

export const MINISTRIES: Ministry[] = [
  {
    id: 'building',
    index: '01',
    zh: '建堂',
    en: 'Building',
    headline: '為人預備一個經歷神同在、認識神的空間。',
    body: '七年來，我們在借來與租來的場地裡敬拜。接下來，我們期待一個能承接更多生命的家——讓週間的小組、孩子的主日學與社區服事都有屬於它的位置。每一筆奉獻的使用都會公開透明地交代。',
    stats: [
      { value: 2500, suffix: '+', label: '每週聚會人次' },
      { value: 1200, suffix: '+', label: '人在這裡受洗' },
      { value: 4500, suffix: '+', label: '過去一年，新朋友走進教會' },
    ],
    statsProvided: true,
    art: 'building',
  },
  {
    id: 'missions',
    index: '02',
    zh: '宣教資助',
    en: 'Missions',
    headline: '宣教，是你我一起的事。讓福音去到我們到不了的地方。',
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
    zh: '外展憐憫事工',
    en: 'Outreach & Hope Week',
    headline: '走出教會與機構合作，建立長久關懷陪伴的關係。',
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
    headline: '製作福音內容觸及華語群體，打造屬於我們的線上 Hope 主日。',
    body: '線上分部牧養的是台北、台中以外的所有地方：台灣其他縣市，還有海外所有的 Hope Nation。這些人沒有一棟可以走進去的教會，但他們有小組和屬於他們的教會生活。\n\n小組開始跨組連結。高雄、香港、吉隆坡的小組聯合舉辦 Watch Party，一起看主日、一起吃飯；不同城市的組員彼此探訪。他們沒有實體的教會建築物，他們相聚在一起，就是教會。',
    stats: [
      { value: 62, suffix: ' 個', label: '線上小組' },
      { value: 390, suffix: '+', label: '小組員每週線上參與' },
      { value: 13, suffix: ' 個', label: '國家／地區' },
      { value: 21, suffix: ' 個', label: '過去一年新成立的小組' },
    ],
    statsProvided: true,
    art: 'online',
  },
  /*
   * The fifth ministry (#18). Name and headline are BB's (11/04); the body, figures and
   * imagery still wait for Comms & TC, and nothing here is invented.
   */
  {
    id: 'cities',
    index: '05',
    zh: '其他城市分部',
    en: 'Future Campuses',
    headline: '一個教會，不同城市。無論在哪裡，都有相同主日體驗。',
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

/** Guiding questions beside the card, where the three steps used to be (11/04). */
export const RESPOND_GUIDE: { icon: 'heart' | 'sunrise'; title: string; text: string }[] = [
  { icon: 'heart', title: 'APPRECIATE｜我感謝神……', text: '回顧過去一年，我在哪裡看見了神的信實？' },
  { icon: 'sunrise', title: 'ANTICIPATE｜我期待和神一起……', text: '展望明年，我期待神如何擴張我的信心？我願意踏出什麼下一步？' },
];

/**
 * Respond copy from BB's 網站文字表 (11/04). The lead's last paragraph is adjusted to the
 * share-to-wall flow ("也可以分享" became "會分享") until BB confirms it.
 */
export const RESPOND = {
  title: '寫下一張屬於你的 FORWARD 卡',
  lead: [
    '回顧過去一年，你最想為什麼感謝神？\n展望明年，你期待神在哪裡擴張你的信心？你願意如何回應？',
    '完成後，這張 FORWARD 卡會分享至線上回應牆，你也可以下載保存。讓你的感謝成為別人的鼓勵，也讓我們彼此的信心，一起走向神要成就的更多。',
  ],
};

/** Ground colours a declaration card can use; canvasCard maps them to the KV swatch. */
export type DeclarationPalette = 'navy' | 'gold' | 'earth';
/** How the frame on the card is drawn, so each declaration has its own look (#23). */
export type DeclarationFrame = 'line' | 'double' | 'arch';

export interface Declaration {
  id: string;
  title: string;
  en: string;
  text: string;
  palette: DeclarationPalette;
  frame: DeclarationFrame;
}

/**
 * The FORWARD 卡 styles (#23): each declaration has its own header, colours and frame.
 * Wording from BB's 網站文字表 (11/04); visitors only pick one, never write their own, and
 * the choice is not stored.
 */
export const DECLARATIONS: Declaration[] = [
  {
    id: 'love-in-action',
    title: '讓愛走進社區',
    en: 'LOVE IN ACTION',
    text: '我參與 Forward，相信教會要走進更多社區，讓人真實經歷耶穌的愛與盼望。',
    palette: 'navy',
    frame: 'line',
  },
  {
    id: 'hope-without-borders',
    title: '讓福音跨越距離',
    en: 'HOPE WITHOUT BORDERS',
    text: '我參與 Forward，相信福音要透過網路進入更多城市，找到每一個正在尋找盼望的人。',
    palette: 'gold',
    frame: 'double',
  },
  {
    id: 'one-church-many-cities',
    title: '在更多城市建立教會的家',
    en: 'ONE CHURCH, MANY CITIES',
    text: '我參與 Forward，相信神要在新的城市預備人、團隊與合適的時機，讓更多人找到教會的家。',
    palette: 'earth',
    frame: 'arch',
  },
];

/** Give finale, BB's 網站文字表 (11/04). BB wrote the kicker as "YEAR END FORWARD 2026 · "; the trailing dot is left off until confirmed. */
export const FINALE = {
  kicker: 'YEAR END FORWARD 2026',
  title: ['There is', 'More'],
  body: '我們能給予，是因為神先慷慨地將恩典、赦免與耶穌賜給了我們。真正的慷慨，不是因為我們「擁有很多」，而是深知自己已經「領受極多」。\n每一次的給予，都是用行動回應神的愛，讓更多人經歷這份盼望。',
  cta: '參與 FORWARD 奉獻',
  disabled: '奉獻連結設定中，正式開放後即可使用。',
};
