/**
 * 01 · Appreciate testimonies (US-03 / US-04, DATA-22).
 *
 * EVERYTHING HERE IS SYNTHETIC: illustrated portraits, invented names and stories used
 * only to validate layout and interaction. Real entries must come from Online Campus
 * with a consent record per person before replacing these.
 *
 * Field names follow the agreed mock_testimonies.json shape:
 * id, name, avatar_url, tags, quote, story_full, video_id.
 */

export type JourneyTagId = 'decision' | 'baptism' | 'course' | 'group';

export interface JourneyTag {
  id: JourneyTagId;
  zh: string;
  en: string;
}

/** Faith-journey markers in order (決志 → 受洗 → 課程 → 小組). Wording awaits Online sign-off. */
export const JOURNEY_TAGS: JourneyTag[] = [
  { id: 'decision', zh: '決志', en: 'Decision' },
  { id: 'baptism', zh: '受洗', en: 'Baptism' },
  { id: 'course', zh: '課程', en: 'Equip' },
  { id: 'group', zh: '小組', en: 'Belong' },
];

export interface Testimony {
  id: string;
  name: string;
  /** Path under /public or an absolute URL. */
  avatar_url: string;
  tags: JourneyTagId[];
  quote: string;
  /** Paragraphs separated by a blank line. Rendered as plain text only. */
  story_full: string;
  /** YouTube video id, or null when the story has no video. */
  video_id: string | null;
  synthetic: true;
}

/** Big Buck Bunny (Blender Foundation, CC BY 3.0) — a neutral stand-in to test the player. */
const TEST_VIDEO = 'aqz-KE-bpKQ';

const avatar = (n: number) => `synthetic/portraits/p${String(n).padStart(2, '0')}.svg`;

export const TESTIMONIES: Testimony[] = [
  {
    id: 't01', name: '佳恩', avatar_url: avatar(1), tags: ['decision', 'baptism'], video_id: TEST_VIDEO, synthetic: true,
    quote: '原來我不是一個人在撐。',
    story_full: '剛搬到台北工作的那個冬天，每天下班回到租屋處都覺得空空的。同事邀我來聖誕聚會，我只是想找個地方待著。\n\n那天詩歌唱到一半我突然哭了。後來我參加了新朋友聚會，也在去年決定受洗。回頭看，那段孤單的日子，其實是神開始找我的時候。',
  },
  {
    id: 't02', name: '思妤', avatar_url: avatar(2), tags: ['decision', 'course', 'group'], video_id: null, synthetic: true,
    quote: '我學會把問題帶到神面前，而不是一個人想破頭。',
    story_full: '以前遇到事情，我習慣自己查資料、自己想辦法，想不通就失眠。上了門徒課程之後，我第一次認真學怎麼禱告。\n\n現在我的小組每週都會一起為彼此的難處禱告。問題不一定馬上解決，但我知道我不用獨自扛。',
  },
  {
    id: 't03', name: '柏翰', avatar_url: avatar(3), tags: ['baptism', 'group'], video_id: null, synthetic: true,
    quote: '小組是我在大學最安全的地方。',
    story_full: '大一的時候我幾乎不跟人說話。學長拉我去校園小組，第一次去只吃了宵夜就走了。\n\n但他們每週都傳訊息問我要不要來。兩年後，我在小組大家的見證下受洗，現在換我每週傳訊息給學弟妹。',
  },
  {
    id: 't04', name: '以琳', avatar_url: avatar(4), tags: ['group'], video_id: null, synthetic: true,
    quote: '隔著時差，我們還是同一個家。',
    story_full: '我在國外念書，和台灣有七個小時的時差。Online 聚會讓我每週還能和教會一起敬拜。\n\n線上小組的姊妹們會配合我的時間約視訊。有一次我生病，她們隔著螢幕陪我禱告了一個小時。距離沒有把我們分開。',
  },
  {
    id: 't05', name: '志豪', avatar_url: avatar(5), tags: ['decision'], video_id: null, synthetic: true,
    quote: '爸爸住院那年，我第一次開口禱告。',
    story_full: '爸爸突然中風，我每天在醫院和公司之間來回，整個人快撐不住。一位弟兄每週來醫院陪我吃晚餐，什麼都沒多說。\n\n有一天我問他：「你們的神真的聽得到嗎？」那天晚上，我在醫院走廊決志。爸爸現在還在復健，但我們家多了盼望。',
  },
  {
    id: 't06', name: '雅筑', avatar_url: avatar(6), tags: ['baptism'], video_id: null, synthetic: true,
    quote: '和媽媽在同一天受洗，是我最想不到的禮物。',
    story_full: '我信主五年，一直為媽媽禱告，但她總說「你開心就好」。去年她陪我來看洗禮，說想試試看新朋友課程。\n\n今年夏天，我們在同一天受洗。她上台前緊緊握著我的手，我知道神聽了這五年的每一個禱告。',
  },
  {
    id: 't07', name: '承恩', avatar_url: avatar(7), tags: ['course', 'group'], video_id: null, synthetic: true,
    quote: '服事讓我看見，信仰不只在週日。',
    story_full: '參加 Hope Week 之前，我以為服事就是在教會幫忙搬椅子。那週我們到社區陪長輩打掃、聊天。\n\n一位阿嬤拉著我說好久沒人來看她了。那一刻我明白，教會存在是為了走出去。現在我在小組裡負責安排每月的社區服事。',
  },
  {
    id: 't08', name: '心怡', avatar_url: avatar(8), tags: ['decision', 'baptism', 'course'], video_id: TEST_VIDEO, synthetic: true,
    quote: '焦慮還會來，但它不再是我的主人。',
    story_full: '有好幾年，我每天醒來都心跳很快，害怕面對一整天。朋友帶我來教會，我坐在最後一排，散會就走。\n\n慢慢地，我開始上課、受洗，也願意求助專業協助。焦慮沒有一夕消失，但我學會在慌亂時安靜下來，想起我被愛著。',
  },
  {
    id: 't09', name: '宇軒', avatar_url: avatar(9), tags: ['decision'], video_id: null, synthetic: true,
    quote: '青年聚會讓我找到說真話的地方。',
    story_full: '高中時我很會裝沒事，成績好、朋友多，但心裡很累。青年聚會的輔導沒有給我大道理，只是一直聽我說。\n\n營會最後一晚，我決定把生命交給神。現在我還是會累，但不用再裝了。',
  },
  {
    id: 't10', name: '詠晴', avatar_url: avatar(10), tags: ['group'], video_id: null, synthetic: true,
    quote: '媽媽小組救了我的產後憂鬱。',
    story_full: '生完第一胎後，我常常一個人在家對著寶寶哭。教會的媽媽小組每週輪流來家裡，帶菜、幫忙抱小孩、陪我聊天。\n\n她們讓我知道，當媽媽不用完美。現在換我去陪新手媽媽們。',
  },
  {
    id: 't11', name: '冠廷', avatar_url: avatar(11), tags: ['baptism', 'course'], video_id: null, synthetic: true,
    quote: '失業的那半年，神的供應沒有遲到。',
    story_full: '公司裁員，我在三十五歲突然失業。那半年我投了上百份履歷，存款一天天變少。\n\n小組的弟兄陪我改履歷、模擬面試，也有人匿名幫我付了一個月房租。後來我找到的工作，比原本的更適合我。我在那年受洗，想把這份感謝說出來。',
  },
  {
    id: 't12', name: '若曦', avatar_url: avatar(12), tags: ['decision', 'group'], video_id: null, synthetic: true,
    quote: '從螢幕前走進聚會現場，只差一個邀請。',
    story_full: '疫情那年我在家看 Online 直播，看了一年都沒出現在教會。有一天線上小組長說：「這週要不要一起吃飯？」\n\n我緊張地去了，發現大家跟螢幕裡一樣溫暖。現在我是 Online 招待團隊的一員，專門歡迎還在螢幕前的朋友。',
  },
  {
    id: 't13', name: '家瑋', avatar_url: avatar(13), tags: ['course'], video_id: null, synthetic: true,
    quote: '領袖課程教我的，是先成為僕人。',
    story_full: '我在職場是主管，習慣下指令。上了領袖課程才發現，屬靈的帶領是先聆聽、先服事。\n\n我開始用這樣的方式帶團隊，同事說我變得好相處。我想這就是信仰走進生活的樣子。',
  },
  {
    id: 't14', name: '品妤', avatar_url: avatar(14), tags: ['baptism', 'group'], video_id: null, synthetic: true,
    quote: '我們的婚姻，被一群人托住。',
    story_full: '結婚第三年，我們幾乎每天吵架，差點走不下去。夫妻小組的前輩們陪我們一次次談，也分享他們走過的低谷。\n\n我們還在學習，但家裡開始有笑聲。去年我們一起受洗，想在大家面前重新立約。',
  },
  {
    id: 't15', name: '俊傑', avatar_url: avatar(15), tags: ['decision', 'baptism'], video_id: null, synthetic: true,
    quote: '我找到比遊戲更值得投入的事。',
    story_full: '大學畢業後我整天窩在家打電動，不知道自己要幹嘛。表哥帶我去參加外展服事，我負責陪小朋友寫功課。\n\n一個孩子說：「哥哥你下週還會來嗎？」那句話讓我想要成為可靠的人。那年我決志，也在隔年受洗。',
  },
  {
    id: 't16', name: '欣妤', avatar_url: avatar(16), tags: ['group'], video_id: null, synthetic: true,
    quote: '悲傷的時候，有人陪著就夠了。',
    story_full: '阿嬤過世後，我好幾個月都提不起勁。小組的朋友沒有勸我快點好起來，只是每週照樣約我散步。\n\n慢慢地，我可以笑著說起阿嬤的故事了。我相信有一天，我們會再見面。',
  },
  {
    id: 't17', name: 'Joanna', avatar_url: avatar(17), tags: ['decision', 'course'], video_id: null, synthetic: true,
    quote: 'A church that felt like home, in a language I was still learning.',
    story_full: '我是來台灣念書的交換學生，中文還不太好。第一次來教會，旁邊的姊姊一句一句幫我翻譯講道。\n\n後來我上了雙語的新朋友課程，在這裡決志。我把這份溫暖帶回了自己的國家。',
  },
  {
    id: 't18', name: 'Samuel', avatar_url: avatar(18), tags: ['baptism', 'group'], video_id: null, synthetic: true,
    quote: '短宣的兩週，改變了我往後的每一天。',
    story_full: '我原本只是想出國看看，就報名了短宣。我們到偏鄉學校帶營隊，住在教室裡打地鋪。\n\n看見當地同工多年的委身，我開始問自己：我可以為神付上什麼？回來後我加入了宣教禱告小組，每月為他們代禱。',
  },
  {
    id: 't19', name: '美玲', avatar_url: avatar(19), tags: ['decision', 'baptism', 'course', 'group'], video_id: null, synthetic: true,
    quote: '七年前的第一次聚會，我坐在最後一排。',
    story_full: '七年前教會還在很小的場地，我被朋友硬拉來，坐在最後一排一直看手機。那天有人記住了我的名字。\n\n決志、受洗、上課、加入小組，每一步都有人陪著。現在我站在門口，當那個記住新朋友名字的人。',
  },
  {
    id: 't20', name: '建宏', avatar_url: avatar(20), tags: ['course'], video_id: null, synthetic: true,
    quote: '從最後一排，走到門口迎接人。',
    story_full: '我個性很害羞，以前聚會都坐在最後、最早離開。上了服事裝備課程後，我鼓起勇氣加入招待團隊。\n\n第一天我緊張到手心冒汗，但一位新朋友對我說謝謝。原來簡單的一句「歡迎你來」，也可以是神使用的方式。',
  },
];
