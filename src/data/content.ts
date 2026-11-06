/**
 * Page copy and section data. All wording and numbers are PLACEHOLDERS until COMMS
 * delivers the final 01–05 copy, statistics and music choices (see the spec's ⑤ 時程).
 * Keep content edits here rather than in the components.
 */

export type ChapterId = 'appreciate' | 'anticipate' | 'respond';

export interface Chapter {
  id: ChapterId;
  index: string;
  /** The step name in the chapter labels, in place of 01/02/03 (11/06); the rail keeps `index`. */
  step: string;
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
  { id: 'appreciate', index: '01', step: '第一步', en: 'Appreciate', zh: '感謝', rail: '我感謝神…' },
  { id: 'anticipate', index: '02', step: '第二步', en: 'Anticipate', zh: '期待', rail: '一起期待…' },
  { id: 'respond', index: '03', step: '第三步', en: 'Respond', zh: '回應', rail: '我願意這樣回應神…' },
];

/** Header nav labels (網站文字表 #1, BB): shown as numbered steps 1–4; the 4th opens the wall page. */
export const NAV_LABELS = {
  appreciate: '感謝',
  anticipate: '期待',
  respond: '填寫 FORWARD 卡',
  wall: '2026 回應牆',
} as const;

/** The rail's last stop, after the three chapters (11/04): it jumps to the Give finale. */
export const RAIL_GIVE = { id: 'give', en: 'There is More', zh: '我要參與奉獻', short: '奉獻' } as const;

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
  // No punctuation (11/04): spaces stand in for the commas, and lines break only at them. A
  // zero-width space marks where a phrase may break on the narrowest phones (320px, 11/06).
  lead: 'APPRECIATE 為神已經成就的獻上感謝\nANTICIPATE 憑著信心 為更多生命與教會所相信的\u200b挪出一個空間 參與在祂將要成就的未來',
};

/**
 * Testimony videos above the polaroid wall (11/05): Comms' unlisted YouTube playlist (6 videos,
 * released over time; at least one at launch). New videos added to the playlist show up on
 * the site by themselves. The site plays from the playlist's first video, so Comms moves each
 * new video to the top and the newest plays first (team choice, 11/05).
 */
export const TESTIMONY_VIDEOS = {
  /** The `list=` value of the playlist link: 「(TEST) THERE IS MORE 線上展覽」 on The Hope's channel (11/05). */
  playlistId: 'PLShQHdcsYZqw',
  title: '見證影片',
  hint: '按下播放，觀看完整見證',
  /** Heading of the thumbnail list beside the player (shown from the second video on). */
  listLabel: '更多見證影片',
};

export const APPRECIATE = {
  // On phones the second clause can't fit one line; the zero-width space keeps 「尋求」 together (11/06).
  title: '教會，就是一張張\u200b尋求神的臉。',
  lead: '從你我的一個回應開始，踏出第一步，再下一步。\n我們聚集的地方，就是見證神正在尋找人的地方；我們所在的地方，就是福音正在發生的地方。在跟隨神的路上，讓我們經歷豐盛，也永遠別忘記我們曾對祂說過的 YES！',
};

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
  /** Keep the label on one line (11/06): it may run a little into the gap beside it. */
  oneLine?: true;
}

/** Ministry JSON shape agreed for US-06; `art` picks the placeholder illustration. */
export interface Ministry {
  id: string;
  index: string;
  zh: string;
  en: string;
  headline: string;
  body: string;
  /** Empty until approved figures exist. */
  stats: Stat[];
  /** Figures came from BB's 網站文字表; the others are still stand-ins (the on-page notes saying so
   *  were removed on 11/06, team choice). */
  statsProvided?: true;
  art: 'building' | 'missions' | 'outreach' | 'online' | 'cities';
  /**
   * Photos for the ministry's carousel (11/05), in order, as paths under public/, e.g.
   * { src: 'ministries/building/01.webp', alt: '…' }. Until Comms sends them, the carousel
   * cycles placeholder frames of `art`.
   */
  photos?: { src: string; alt: string }[];
}

export const ANTICIPATE = {
  title: 'FORWARD 是十一之外的慷慨奉獻。',
  lead: '它不只為一個場地，也不是一次性的募款，而是持續支持五大事工。\n每一份給予，都幫助教會接觸人群、帶領更多人認識耶穌，並朝著 The Hope「在我們所到的每個城市，贏得 1% 的人」的異象一起前進。',
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
  /** Photos under public/ (Comms', 16:10), shown in turn when there are several; the tab shows a
   *  placeholder without any. */
  photos?: { src: string; alt: string }[];
  /** Where the large faint name goes on wide screens: under the photo (default) or, when the
   *  photo is tall and leaves no room, under the story (11/06). */
  markUnder?: 'photo' | 'story';
  /** The faint name in lines of your own (伯大尼／兒少家園); one line, the name, otherwise. */
  markLines?: string[];
  /** Under the photo, flush right instead of left (伯大尼, 11/06). */
  markAlign?: 'start' | 'end';
}

/**
 * The partner organisations shown as tabs under 外展憐憫事工 (#26, plan C: 分頁切換, no auto
 * rotation). Text from the outreach team's write-ups, supplied again by the team on 11/05.
 * Ian asked on 11/04 for placeholders until names, stories and photos are confirmed, so check
 * with him / Comms before this goes public. Paragraphs are separated by a blank line.
 */
export const OUTREACH_PARTNERS: OutreachPartner[] = [
  {
    id: 'partner-bethany',
    markLines: ['伯大尼', '兒少家園'],
    markAlign: 'end',
    photos: [
      { src: 'partners/partner-bethany-01.webp', alt: '伯大尼兒少家園' },
      { src: 'partners/partner-bethany-02.webp', alt: '伯大尼兒少家園' },
    ],
    name: '伯大尼兒少家園',
    title: '每個名字背後，都是新的可能',
    body: '我們持續走進一個很特別的地方，「伯大尼兒少家園」。這裡收容、照顧那些失親、失依、家庭經濟生活困難和需要專業協助的孩子。從嬰幼兒到十八歲的少年，都在這裡被接納、被保護。\n\n從 2025 年至今，我們每個月和 Outreach 團隊夥伴們都會到伯大尼，和孩子們一起唱詩歌、禱告、分享聖經故事。在笑聲和遊戲中，關係一點一滴地被建立。\n\n在 2026 年 Outreach 團隊開始使用不同的聖經故事教材，透過敬拜及更多互動的方式，讓築起了一座座小小的堡壘的孩子們，從不太願意說出自己的名字，保護著那顆不再敢輕易打開的心，夥伴持續的陪伴，除了孩子們對服事夥伴開始說出「他真實的名字」，更多的是願意敞開跟夥伴聊自己的生活。\n\n不只是一個孩子的名字，而是一扇曾經關上的心門，慢慢被打開。一個願意被看見、被聽見的靈魂，能開始重新相信，未來是可能的。我們不希望外展只是個任務，我們盼望憐憫能長出關係，而這關係能讓人經歷神的愛！',
  },
  {
    id: 'partner-angel-tree',
    photos: [
      { src: 'partners/partner-angel-tree-01.webp', alt: '天使樹' },
      { src: 'partners/partner-angel-tree-02.webp', alt: '天使樹' },
    ],
    name: '天使樹',
    title: '陪伴不是一次性的活動，是持續的同行',
    body: '天使樹更生團契，服事的是更生人的孩子。加入服事前，夥伴會先完成一系列培訓課程——四個週六的早晨，在校園書房的教室裡，從聖經、筆記本到一顆願意學習的心，一步步預備自己如何靠近孩子的生命。\n\n培訓之後，就進入「關懷大隊」：一對一陪伴孩子三個月，一起吃飯、喝下午茶、公園玩球，每個月也有團契時間一起跳舞、敬拜。今年孩子們迎來了關懷大隊畢業典禮，也在兒童節那天，帶著孩子們走進文山農場，體驗大自然生態導覽、採茶、烤肉與闖關遊戲，在笑聲裡度過屬於他們的一天。\n\n9 到 12 月的聖誕送禮行動也隨之展開，讓每一份禮物背後，都是一段被記得的關係。從去年 11 月的 1 人，成長到今天將近 30 位夥伴投入。',
  },
  {
    id: 'partner-mustard-seed',
    photos: [
      { src: 'partners/partner-mustard-seed-01.webp', alt: '基督教芥菜種會' },
      { src: 'partners/partner-mustard-seed-02.webp', alt: '基督教芥菜種會' },
      { src: 'partners/partner-mustard-seed-03.webp', alt: '基督教芥菜種會' },
    ],
    name: '基督教芥菜種會',
    title: '我們一起走，讓福音走進各個角落',
    body: '我們跟芥菜種會合作，透過「偏鄉關懷」、「營隊外展」與「活動外展」三個面向，走進不同的地方，將關懷與陪伴帶給更多人。\n\n偏鄉關懷，我們定期前往新竹五峰達谷婻長老教會、尖石田埔長老教會，協助當地弟兄姊妹務農，也探訪獨居長者，透過實際行動，關心他們的生活與需要。\n\n營隊外展，在寒暑假期間，我們走進營隊擔任小隊輔，陪伴國小到高中的孩子。今年也持續展開花蓮營隊，透過陪伴與互動，成為孩子成長路上的支持。\n\n活動外展，我們透過敬拜、舞蹈與見證分享，走進不同社區和校園，與更多人建立關係。同時持續推動「無邊界事工」，讓服事跨越地域與場地的限制，把愛與祝福帶到更多地方。',
  },
  {
    id: 'partner-lien',
    markUnder: 'story',
    name: '禮恩康復育成協會',
    title: '戒癮最短的捷徑，就是一次次的真誠陪伴',
    body: '禮恩戒癮機構是我們今年新加入的事工，服事對象是正在走療程的戒癮者。\n\n服事內容看似單純的陪伴，但更重要的是每兩週一次、由 Alan 及 Irene 帶領的戒癮小組，夥伴在其中安靜地坐下來，陪伴戒癮者一起參與。\n\n我們相信，恢復並不是一瞬間的事，更是需要有人願意一次又一次地出現、一次又一次地陪伴，讓戒癮者知道，自己不是一個人在走這條路。',
  },
  {
    id: 'partner-kaohsiung-women',
    markUnder: 'story',
    photos: [
      { src: 'partners/partner-kaohsiung-women-01.webp', alt: '高雄女子監獄' },
    ],
    name: '高雄女子監獄',
    title: '高牆之內，眼前不會只剩絕望的風景',
    body: '我們相信，沒有一道高牆，能阻擋福音的盼望。走進高雄女子監獄，是我們實踐「無邊界事工」的重要一步。\n\n透過現場音樂、街舞敬拜、信息與見證分享，以及為她們禱告，我們盼望讓每一位女性都有機會聽見福音，親自經歷神的愛。\n\n在這裡，我們陪伴著一群曾經犯錯、正在為人生尋找重新開始機會的女性。透過定期的探訪與關懷，讓她們知道，即使身處高牆之內，仍然有人記得她們、願意聽她們說話，也相信她們的人生還有更多可能。',
  },
];

export const MINISTRIES: Ministry[] = [
  {
    id: 'building',
    index: '01',
    zh: '建堂',
    en: 'Building',
    headline: '為人預備一個經歷神同在、認識神的空間。',
    // 網站文字表 #31 (BB's blue edit), reworded by the team on 11/06.
    body: '這七年來，我們在不同的場地聚集敬拜，看見一張又一張的臉走進教會、遇見耶穌。接下來，我們期待預備一個能見證更多生命翻轉的家。讓主日、週間小組、孩子的主日學與社區服事都有專屬的空間，並讓一個又一個生命改變的見證，能持續充滿在這個空間。\n\n因為建堂，不只是為了一個場地，更是為了那些還沒走進來的人，預備一個能遇見耶穌、在基督裡找到榮耀盼望的家。',
    stats: [
      { value: 2500, suffix: '+', label: '每週聚會人次' },
      { value: 1200, suffix: '+', label: '人在這裡受洗' },
      { value: 4500, suffix: '+', label: '過去一年，新朋友走進教會' },
    ],
    statsProvided: true,
    art: 'building',
    // Comms' photos (見證與五大事工照片, 11/06), cropped 4:3 into public/ministries/.
    photos: [
      { src: 'ministries/building/01.webp', alt: '台中分部獻堂' },
      { src: 'ministries/building/02.webp', alt: '台北光復南路：聚會場地' },
      { src: 'ministries/building/03.webp', alt: '台中分部：在還沒完工的場地裡一起敬拜' },
      { src: 'ministries/building/04.webp', alt: '台北內湖：同工圍成一圈禱告' },
      { src: 'ministries/building/05.webp', alt: '台北內湖：跪下為場地禱告' },
      { src: 'ministries/building/06.webp', alt: '台北光復南路場地開幕' },
      { src: 'ministries/building/07.webp', alt: '台北光復南路：兒童主日學的空間' },
      { src: 'ministries/building/08.webp', alt: '台中分部：一起佈置新場地' },
      { src: 'ministries/building/09.webp', alt: '台中分部：在新場地裡敬拜' },
      { src: 'ministries/building/10.webp', alt: '台北內湖：在新場地裡禱告' },
      { src: 'ministries/building/11.webp', alt: '台北敦化場地' },
      { src: 'ministries/building/12.webp', alt: '台中分部：在新場地裡分享' },
      { src: 'ministries/building/13.webp', alt: '台北內湖：為新場地禱告' },
      { src: 'ministries/building/14.webp', alt: '台北敦化場地' },
      { src: 'ministries/building/15.webp', alt: '台北光復南路：施工中的場地' },
      { src: 'ministries/building/16.webp', alt: '台北光復南路：施工中的場地' },
      { src: 'ministries/building/17.webp', alt: '台中分部：架設新場地' },
      { src: 'ministries/building/18.webp', alt: '台中分部：佈置新場地' },
    ],
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
    // Comms' photos (見證與五大事工照片, 11/06), cropped 4:3 into public/ministries/.
    photos: [
      { src: 'ministries/missions/01.webp', alt: '短宣隊與當地教會合影' },
      { src: 'ministries/missions/02.webp', alt: '短宣隊與當地的弟兄姊妹' },
      { src: 'ministries/missions/03.webp', alt: '馬來西亞短宣：一起敬拜' },
      { src: 'ministries/missions/04.webp', alt: '馬來西亞短宣：和孩子們奔跑' },
      { src: 'ministries/missions/05.webp', alt: '馬來西亞短宣：和孩子們用餐' },
      { src: 'ministries/missions/06.webp', alt: '短宣隊員' },
      { src: 'ministries/missions/07.webp', alt: '當地教會的聚會' },
      { src: 'ministries/missions/08.webp', alt: '馬來西亞短宣：探訪' },
      { src: 'ministries/missions/09.webp', alt: '短宣隊的聚會' },
      { src: 'ministries/missions/10.webp', alt: 'Home team 短宣' },
    ],
  },
  {
    id: 'outreach',
    index: '03',
    zh: '外展憐憫事工',
    en: 'Outreach & Hope Week',
    // 網站文字表 #38–40 (BB's blue edits): headline, body and figures.
    headline: '走出教會與機構合作，建立長久關懷陪伴的關係。',
    body: '過去一年，我們的長期合作機構增加到 5 個，40 位穩定參與的服事夥伴，持續走進兒少家園、戒癮機構，也走進偏鄉教會與社區，透過陪伴、關懷、營隊、活動與福音行動，持續把教會的愛帶到需要的地方。\n\n我們在意的，從來不只是「今天做了什麼」，而是「關係有沒有留下來」。\n\n因為我們相信，當我們願意一次又一次走進人的生命，在一段真實的關係裡，人可以被看見、被陪伴，也有機會遇見神的愛。',
    stats: [
      { value: 500, suffix: '+', label: '過去四年，服事志工參與在 Hope Week 機構志工服務的外展行動' },
      { value: 191, label: '位夥伴參與愛心樹禮物認領', oneLine: true },
      { value: 204, suffix: '+', label: '人參與我有盼望我捐血的行動' },
    ],
    statsProvided: true,
    art: 'outreach',
    // Comms' photos (見證與五大事工照片, 11/06), cropped 4:3 into public/ministries/: the outreach
    // work beyond the five partners, whose own photos sit in their tabs below (team choice).
    photos: [
      { src: 'ministries/outreach/01.webp', alt: '台中惠明盲校' },
      { src: 'ministries/outreach/02.webp', alt: '宜誠群星閃耀營' },
      { src: 'ministries/outreach/03.webp', alt: '舊鞋救命' },
      { src: 'ministries/outreach/04.webp', alt: '鈺善園' },
    ],
  },
  {
    id: 'online',
    index: '04',
    zh: '網路宣教',
    en: 'Online Ministry',
    headline: '製作福音內容觸及華語群體，打造屬於我們的線上 Hope 主日。',
    // 網站文字表 #43 (BB's blue edit).
    body: 'The Hope 持續製作福音內容，線上分部也讓牧養跨越城市，陪伴分散各地的 Hope Nation。這份陪伴不只是在線上 Hope 主日和小組，也延伸到日常之中：我們彼此認識，一起跟隨耶穌。\n\n高雄、香港、吉隆坡的小組一起舉辦 Watch Party、不同城市的組員也彼此探訪：距離仍在，關係卻走進生活。在這些相聚中，我們一同見證神如何帶領在不同時區的人們，一起敬拜、共同前行。',
    stats: [
      { value: 62, suffix: ' 個', label: '線上小組' },
      { value: 390, suffix: '+', label: '小組員每週線上參與' },
      { value: 13, suffix: ' 個', label: '國家／地區' },
      { value: 21, suffix: ' 個', label: '過去一年新成立的小組' },
    ],
    statsProvided: true,
    art: 'online',
    // Comms' photos (線上 Forward 展覽 - 照片, 11/06): the production team, then the Hope Nation
    // groups (Coffee with The Hope, Good Neighbor). Cropped 4:3 into public/ministries/.
    photos: [
      { src: 'ministries/online/01.webp', alt: '網路宣教的製作團隊' },
      { src: 'ministries/online/02.webp', alt: '網路宣教的製作團隊' },
      { src: 'ministries/online/03.webp', alt: '網路宣教的製作團隊' },
      { src: 'ministries/online/04.webp', alt: '網路宣教的製作團隊' },
      { src: 'ministries/online/05.webp', alt: '網路宣教的製作團隊' },
      { src: 'ministries/online/06.webp', alt: '網路宣教的製作團隊' },
      { src: 'ministries/online/07.webp', alt: '網路宣教的製作團隊' },
      { src: 'ministries/online/08.webp', alt: '美國 Hope Nation' },
      { src: 'ministries/online/09.webp', alt: '美國 Hope Nation' },
      { src: 'ministries/online/10.webp', alt: '香港 Hope Nation 小組' },
      { src: 'ministries/online/11.webp', alt: '金門 Hope Nation 小組' },
      { src: 'ministries/online/12.webp', alt: '洛杉磯 Hope Nation 小組' },
      { src: 'ministries/online/13.webp', alt: '洛杉磯 Hope Nation 小組' },
      { src: 'ministries/online/14.webp', alt: '洛杉磯 Hope Nation 小組' },
      { src: 'ministries/online/15.webp', alt: '洛杉磯 Hope Nation 小組' },
      { src: 'ministries/online/16.webp', alt: '台南 Hope Nation 小組' },
      { src: 'ministries/online/17.webp', alt: '香港 Hope Nation 小組' },
      { src: 'ministries/online/18.webp', alt: 'Hope Nation 小組' },
      { src: 'ministries/online/19.webp', alt: '吉隆坡 Hope Nation 小組' },
      { src: 'ministries/online/20.webp', alt: '吉隆坡 Hope Nation 小組' },
      { src: 'ministries/online/21.webp', alt: '台東 Hope Nation 小組' },
      { src: 'ministries/online/22.webp', alt: '峇里島 Hope Nation 小組' },
      { src: 'ministries/online/23.webp', alt: '柔佛 Hope Nation 小組' },
      { src: 'ministries/online/24.webp', alt: '台中 Hope Nation 小組' },
      { src: 'ministries/online/25.webp', alt: '多倫多 Hope Nation 小組' },
      { src: 'ministries/online/26.webp', alt: '多倫多 Hope Nation 小組' },
      { src: 'ministries/online/27.webp', alt: '多倫多 Hope Nation 小組' },
      { src: 'ministries/online/28.webp', alt: '新竹 Hope Nation 小組' },
      { src: 'ministries/online/29.webp', alt: '桃園 Hope Nation 小組' },
      { src: 'ministries/online/30.webp', alt: '檳城 Hope Nation 小組' },
      { src: 'ministries/online/31.webp', alt: '高雄 Hope Nation 小組' },
    ],
  },
  /*
   * The fifth ministry (#18). Name and headline are BB's (11/04), the body too (網站文字表 #47);
   * the figures and imagery still wait for Comms & TC, and nothing here is invented.
   */
  {
    id: 'cities',
    index: '05',
    zh: '其他城市分部',
    en: 'Future Campuses',
    headline: '一個教會，不同城市。無論在哪裡，都有相同主日體驗。',
    body: '台中分部，是 The Hope 在另一座城市扎根的第一步，讓人們能在自己的城市參與主日、一起敬拜、聽見神的話。\n\n我們期待這樣的教會生活，未來也能在更多城市發生："One Church, Many Cities"，雖然每座城市都有不同的人與故事，但都能透過一樣的 Hope 主日體驗，找到同行的群體、實踐信仰，成為城市的盼望。',
    stats: [],
    art: 'cities',
    // Comms' photos (線上 Forward 展覽 - 照片, 11/06): only 台中分部 here; the Hope Nation groups
    // moved to 網路宣教 in their folders. Cropped 4:3 into public/ministries/.
    photos: [
      { src: 'ministries/cities/01.webp', alt: '台中分部' },
      { src: 'ministries/cities/02.webp', alt: '台中分部' },
      { src: 'ministries/cities/03.webp', alt: '台中分部' },
      { src: 'ministries/cities/04.webp', alt: '台中分部' },
      { src: 'ministries/cities/05.webp', alt: '台中分部' },
    ],
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
  { icon: 'heart', title: 'APPRECIATE｜我感謝神...', text: '回顧過去一年，我在哪裡看見了神的信實？' },
  { icon: 'sunrise', title: 'ANTICIPATE｜跟神一起期待...', text: '展望明年，我期待神如何擴張我的信心？我願意踏出什麼下一步？' },
];

/**
 * Respond copy from BB's 網站文字表 (11/04). The lead's last paragraph is adjusted to the
 * share-to-wall flow ("也可以分享" became "會分享") until BB confirms it.
 */
export const RESPOND = {
  title: '寫下一張屬於你的 FORWARD 卡',
  lead: [
    '回顧過去一年，你最想為什麼感謝神？\n展望明年，你期待神在哪裡擴張你的信心？你願意如何回應？',
    '完成後，這張 FORWARD 卡會經過文字審核並公開在 2026 回應牆；你也可以下載保存。讓你的感謝成為別人的鼓勵，也讓我們彼此的信心，一起走向神要成就的更多。',
  ],
};

/** Ground colours a card style can use; canvasCard maps them to the KV swatch. `paper` is
    the printed FORWARD 卡's brown with its line drawing. */
export type DeclarationPalette = 'navy' | 'gold' | 'earth' | 'paper';
/** How the frame on the card is drawn, so each declaration has its own look (#23). */
export type DeclarationFrame = 'line' | 'double' | 'arch' | 'none';

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
 * Wording from BB's 網站文字表 (11/04), titles and sentences revised 11/06; visitors only pick
 * one, never write their own, and the choice is not stored.
 */
export const DECLARATIONS: Declaration[] = [
  {
    id: 'love-in-action',
    title: '讓愛走進這城市',
    en: 'LOVE IN ACTION',
    text: '我參與 FORWARD，為了那些還沒走進教會的人，讓更多人有機會聽見福音、遇見耶穌。',
    palette: 'navy',
    frame: 'line',
  },
  {
    id: 'hope-without-borders',
    title: '讓福音跨越距離',
    en: 'HOPE WITHOUT BORDERS',
    text: '我參與 FORWARD，相信福音能透過網路，進到更多城市，讓每個尋找盼望的人，都能在手中的手機裡，看見福音。',
    palette: 'gold',
    frame: 'double',
  },
  {
    id: 'one-church-many-cities',
    title: '在更多城市建造祂的教會',
    en: 'ONE CHURCH, MANY CITIES',
    text: '我參與 FORWARD，相信神要在新的城市預備人、團隊與合適的時機，帶領更多人一起建造祂的教會。',
    palette: 'earth',
    frame: 'arch',
  },
];

/** The declarations the visitor picks from for the downloaded card (11/06: always one of the three
 *  on the paper card; the separate colour styles and the plain paper option went). */
export const CARD_STYLES: Declaration[] = DECLARATIONS;

/** Give finale, BB's 網站文字表 (11/04; body revised 11/06). BB wrote the kicker as "YEAR END FORWARD 2026 · "; the trailing dot is left off until confirmed. */
export const FINALE = {
  kicker: 'YEAR END FORWARD 2026',
  title: ['There is', 'More'],
  body: '我們能夠慷慨，是因為神早已將祂的救恩，甚至祂的獨生愛子耶穌，慷慨地賜給了我們。\n\n真正的慷慨，不是因為我們擁有很多，而是真實領受了祂何等豐盛的愛。讓每一次的給予，都是神的愛吸引我們，讓我們願意做出回應，使更多人有機會遇見耶穌、經歷這份盼望。',
  cta: '參與 FORWARD 奉獻',
  disabled: '奉獻連結設定中，正式開放後即可使用。',
};
