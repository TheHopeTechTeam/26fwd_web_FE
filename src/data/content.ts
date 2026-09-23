/**
 * Page copy and section data. All wording and numbers are PLACEHOLDERS until COMMS
 * delivers the final 01–05 copy, statistics and music choices (see the spec's ⑤ 時程).
 * Keep content edits here rather than in the components.
 */

export type ChapterId = 'appreciate' | 'transition' | 'anticipate' | 'respond';

export interface Chapter {
  id: ChapterId;
  index: string;
  en: string;
  zh: string;
}

/** The four journey stops the right-hand rail tracks (US-01). */
export const CHAPTERS: Chapter[] = [
  { id: 'appreciate', index: '01', en: 'Appreciate', zh: '感謝' },
  { id: 'transition', index: '02', en: 'Transition', zh: '轉身' },
  { id: 'anticipate', index: '03', en: 'Anticipate', zh: '期待' },
  { id: 'respond', index: '04', en: 'Respond', zh: '回應' },
];

export const HERO = {
  kicker: 'THE HOPE · SINCE 2019',
  title: 'FORWARD',
  year: '2026',
  tagline: 'There is more',
  lead: '感謝神過去七年的信實，一起期待祂要成就的更多。',
  cta: '開始旅程',
};

export const APPRECIATE = {
  title: '神的信實，寫在每一張臉上',
  lead: '七年來，神在一個又一個生命裡留下記號。選一個信仰歷程聚焦，或直接點開一張臉，讀一段故事。',
  note: '示意人物為合成插畫與虛構故事（synthetic），正式見證素材與授權待 Online Campus 交付。',
};

export interface Mood {
  id: 'still' | 'turning' | 'hope';
  zh: string;
  en: string;
  description: string;
  track: {
    title: string;
    artist: string;
    src: string;
    /** Seconds; used until the audio metadata loads. */
    duration: number;
    sourceUrl: string;
    license: string;
  };
}

/** Resolved against the deploy base, so it works on every preview URL. */
const AUDIO_SOURCE = 'audio/ATTRIBUTION.md';

export const TRANSITION = {
  title: '從感謝，轉身向前',
  lead: '我們回頭看見神的信實，也誠實面對仍在路上的自己。選一段最貼近此刻的心情，按下播放，安靜幾分鐘，再一起往前走。',
  note: '測試音樂為本專案自製的合成曲目，正式選曲與授權待 COMMS 確認。',
};

export const MOODS: Mood[] = [
  {
    id: 'still',
    zh: '沉靜感謝',
    en: 'Still Gratitude',
    description: '安靜下來，一件一件數算這一年的恩典。',
    track: { title: 'Still Waters', artist: 'FORWARD Synth Lab（測試音訊）', src: 'audio/still-waters.m4a', duration: 90, sourceUrl: AUDIO_SOURCE, license: 'CC0（本專案自製）' },
  },
  {
    id: 'turning',
    zh: '誠實轉身',
    en: 'Honest Turning',
    description: '把遺憾、疲憊與還沒解決的問題，誠實地交給神。',
    track: { title: 'Turning', artist: 'FORWARD Synth Lab（測試音訊）', src: 'audio/turning.m4a', duration: 72, sourceUrl: AUDIO_SOURCE, license: 'CC0（本專案自製）' },
  },
  {
    id: 'hope',
    zh: '盼望向前',
    en: 'Hope Forward',
    description: '抬起頭來，相信還有更多。There is more.',
    track: { title: 'Daybreak', artist: 'FORWARD Synth Lab（測試音訊）', src: 'audio/daybreak.m4a', duration: 91, sourceUrl: AUDIO_SOURCE, license: 'CC0（本專案自製）' },
  },
];

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
  stats: Stat[];
  art: 'building' | 'missions' | 'outreach' | 'online';
}

export const ANTICIPATE = {
  title: '神要帶我們去的地方',
  lead: '四項事工，加上一面代禱的牆。這是我們一起期待、也一起預備的未來。',
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
];

export const ONE_WALL = {
  index: '05',
  en: 'The One Wall',
  zh: '代禱牆',
  headline: '一起為彼此禱告',
  body: 'The One Wall 直接連到 Prayer Map：在地圖上為城市、為彼此代禱。往前走的路上，沒有人需要獨自禱告。',
  blocked: 'Prayer Map 目前尚未開放在其他網站內嵌顯示，請在新分頁開啟。',
  privacy: '本頁不會把你在 FORWARD 網站填寫的任何資料傳送到 Prayer Map。',
};

export const RESPOND = {
  title: 'Write it forward',
  lead: '寫下一張屬於你的 Forward Card：一句感謝，一個期待。送出後由團隊審閱，再公開到卡片牆與全 Hope Nation 分享。',
};

export const FINALE = {
  kicker: 'FORWARD 2026 · GIVE',
  title: ['There is', 'more'],
  body: '透過奉獻，一起為神接下來要成就的事預備空間。你的每一份擺上，都會成為建堂、宣教、外展與網路宣教往前的一步。',
  cta: '參與 FORWARD 奉獻',
  disabled: '奉獻連結設定中，正式開放後即可使用。',
};
