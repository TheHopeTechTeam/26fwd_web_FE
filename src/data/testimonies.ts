/**
 * 01 · Appreciate testimonies (US-03 / US-04, DATA-22).
 *
 * EVERYTHING HERE IS SYNTHETIC: illustrated portraits, invented names and stories used
 * only to validate layout and interaction. Real entries must come from Online Campus
 * with a consent record per person before replacing these.
 *
 * Field names follow the agreed mock_testimonies.json shape:
 * id, name, avatar_url, quote, story_full, video_id. The faith-journey tags (決志/受洗…)
 * were dropped on 11/04 (BB: 不需要分類).
 */

export interface Testimony {
  id: string;
  name: string;
  /** Path under /public or an absolute URL. */
  avatar_url: string;
  /** The one-line title shown on the polaroid under the name (the 【…】 line in a submission). */
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
    id: 't01', name: '佳恩', avatar_url: avatar(1), video_id: TEST_VIDEO, synthetic: true,
    quote: '原來我不是一個人在撐。',
    story_full: '剛搬到台北工作的那個冬天，每天下班回到租屋處都覺得空空的。同事邀我來聖誕聚會，我只是想找個地方待著。\n\n那天詩歌唱到一半我突然哭了。後來我參加了新朋友聚會，也在去年決定受洗。回頭看，那段孤單的日子，其實是神開始找我的時候。',
  },
  {
    id: 't02', name: '思妤', avatar_url: avatar(2), video_id: null, synthetic: true,
    quote: '我學會把問題帶到神面前，而不是一個人想破頭。',
    story_full: '以前遇到事情，我習慣自己查資料、自己想辦法，想不通就失眠。上了門徒課程之後，我第一次認真學怎麼禱告。\n\n現在我的小組每週都會一起為彼此的難處禱告。問題不一定馬上解決，但我知道我不用獨自扛。',
  },
  {
    id: 't03', name: '柏翰', avatar_url: avatar(3), video_id: null, synthetic: true,
    quote: '小組是我在大學最安全的地方。',
    story_full: '大一的時候我幾乎不跟人說話。學長拉我去校園小組，第一次去只吃了宵夜就走了。\n\n但他們每週都傳訊息問我要不要來。兩年後，我在小組大家的見證下受洗，現在換我每週傳訊息給學弟妹。',
  },
  {
    id: 't04', name: '以琳', avatar_url: avatar(4), video_id: null, synthetic: true,
    quote: '隔著時差，我們還是同一個家。',
    story_full: '我在國外念書，和台灣有七個小時的時差。Online 聚會讓我每週還能和教會一起敬拜。\n\n線上小組的姊妹們會配合我的時間約視訊。有一次我生病，她們隔著螢幕陪我禱告了一個小時。距離沒有把我們分開。',
  },
  {
    id: 't05', name: '志豪', avatar_url: avatar(5), video_id: null, synthetic: true,
    quote: '爸爸住院那年，我第一次開口禱告。',
    story_full: '爸爸突然中風，我每天在醫院和公司之間來回，整個人快撐不住。一位弟兄每週來醫院陪我吃晚餐，什麼都沒多說。\n\n有一天我問他：「你們的神真的聽得到嗎？」那天晚上，我在醫院走廊決志。爸爸現在還在復健，但我們家多了盼望。',
  },
  {
    id: 't06', name: '雅筑', avatar_url: avatar(6), video_id: null, synthetic: true,
    quote: '和媽媽在同一天受洗，是我最想不到的禮物。',
    story_full: '我信主五年，一直為媽媽禱告，但她總說「你開心就好」。去年她陪我來看洗禮，說想試試看新朋友課程。\n\n今年夏天，我們在同一天受洗。她上台前緊緊握著我的手，我知道神聽了這五年的每一個禱告。',
  },
  {
    id: 't07', name: '承恩', avatar_url: avatar(7), video_id: null, synthetic: true,
    quote: '服事讓我看見，信仰不只在週日。',
    story_full: '參加 Hope Week 之前，我以為服事就是在教會幫忙搬椅子。那週我們到社區陪長輩打掃、聊天。\n\n一位阿嬤拉著我說好久沒人來看她了。那一刻我明白，教會存在是為了走出去。現在我在小組裡負責安排每月的社區服事。',
  },
  {
    id: 't08', name: '心怡', avatar_url: avatar(8), video_id: TEST_VIDEO, synthetic: true,
    quote: '焦慮還會來，但它不再是我的主人。',
    story_full: '有好幾年，我每天醒來都心跳很快，害怕面對一整天。朋友帶我來教會，我坐在最後一排，散會就走。\n\n慢慢地，我開始上課、受洗，也願意求助專業協助。焦慮沒有一夕消失，但我學會在慌亂時安靜下來，想起我被愛著。',
  },
  {
    id: 't09', name: '宇軒', avatar_url: avatar(9), video_id: null, synthetic: true,
    quote: '青年聚會讓我找到說真話的地方。',
    story_full: '高中時我很會裝沒事，成績好、朋友多，但心裡很累。青年聚會的輔導沒有給我大道理，只是一直聽我說。\n\n營會最後一晚，我決定把生命交給神。現在我還是會累，但不用再裝了。',
  },
  {
    id: 't10', name: '詠晴', avatar_url: avatar(10), video_id: null, synthetic: true,
    quote: '媽媽小組救了我的產後憂鬱。',
    story_full: '生完第一胎後，我常常一個人在家對著寶寶哭。教會的媽媽小組每週輪流來家裡，帶菜、幫忙抱小孩、陪我聊天。\n\n她們讓我知道，當媽媽不用完美。現在換我去陪新手媽媽們。',
  },
  {
    id: 't11', name: '冠廷', avatar_url: avatar(11), video_id: null, synthetic: true,
    quote: '失業的那半年，神的供應沒有遲到。',
    story_full: '公司裁員，我在三十五歲突然失業。那半年我投了上百份履歷，存款一天天變少。\n\n小組的弟兄陪我改履歷、模擬面試，也有人匿名幫我付了一個月房租。後來我找到的工作，比原本的更適合我。我在那年受洗，想把這份感謝說出來。',
  },
  {
    id: 't12', name: '若曦', avatar_url: avatar(12), video_id: null, synthetic: true,
    quote: '從螢幕前走進聚會現場，只差一個邀請。',
    story_full: '疫情那年我在家看 Online 直播，看了一年都沒出現在教會。有一天線上小組長說：「這週要不要一起吃飯？」\n\n我緊張地去了，發現大家跟螢幕裡一樣溫暖。現在我是 Online 招待團隊的一員，專門歡迎還在螢幕前的朋友。',
  },
  {
    id: 't13', name: '家瑋', avatar_url: avatar(13), video_id: null, synthetic: true,
    quote: '領袖課程教我的，是先成為僕人。',
    story_full: '我在職場是主管，習慣下指令。上了領袖課程才發現，屬靈的帶領是先聆聽、先服事。\n\n我開始用這樣的方式帶團隊，同事說我變得好相處。我想這就是信仰走進生活的樣子。',
  },
  {
    id: 't14', name: '品妤', avatar_url: avatar(14), video_id: null, synthetic: true,
    quote: '我們的婚姻，被一群人托住。',
    story_full: '結婚第三年，我們幾乎每天吵架，差點走不下去。夫妻小組的前輩們陪我們一次次談，也分享他們走過的低谷。\n\n我們還在學習，但家裡開始有笑聲。去年我們一起受洗，想在大家面前重新立約。',
  },
  {
    id: 't15', name: '俊傑', avatar_url: avatar(15), video_id: null, synthetic: true,
    quote: '我找到比遊戲更值得投入的事。',
    story_full: '大學畢業後我整天窩在家打電動，不知道自己要幹嘛。表哥帶我去參加外展服事，我負責陪小朋友寫功課。\n\n一個孩子說：「哥哥你下週還會來嗎？」那句話讓我想要成為可靠的人。那年我決志，也在隔年受洗。',
  },
  {
    id: 't16', name: '欣妤', avatar_url: avatar(16), video_id: null, synthetic: true,
    quote: '悲傷的時候，有人陪著就夠了。',
    story_full: '阿嬤過世後，我好幾個月都提不起勁。小組的朋友沒有勸我快點好起來，只是每週照樣約我散步。\n\n慢慢地，我可以笑著說起阿嬤的故事了。我相信有一天，我們會再見面。',
  },
  {
    id: 't17', name: 'Joanna', avatar_url: avatar(17), video_id: null, synthetic: true,
    quote: 'A church that felt like home, in a language I was still learning.',
    story_full: '我是來台灣念書的交換學生，中文還不太好。第一次來教會，旁邊的姊姊一句一句幫我翻譯講道。\n\n後來我上了雙語的新朋友課程，在這裡決志。我把這份溫暖帶回了自己的國家。',
  },
  {
    id: 't18', name: 'Samuel', avatar_url: avatar(18), video_id: null, synthetic: true,
    quote: '短宣的兩週，改變了我往後的每一天。',
    story_full: '我原本只是想出國看看，就報名了短宣。我們到偏鄉學校帶營隊，住在教室裡打地鋪。\n\n看見當地同工多年的委身，我開始問自己：我可以為神付上什麼？回來後我加入了宣教禱告小組，每月為他們代禱。',
  },
  {
    id: 't19', name: '美玲', avatar_url: avatar(19), video_id: null, synthetic: true,
    quote: '七年前的第一次聚會，我坐在最後一排。',
    story_full: '七年前教會還在很小的場地，我被朋友硬拉來，坐在最後一排一直看手機。那天有人記住了我的名字。\n\n決志、受洗、上課、加入小組，每一步都有人陪著。現在我站在門口，當那個記住新朋友名字的人。',
  },
  {
    id: 't20', name: '建宏', avatar_url: avatar(20), video_id: null, synthetic: true,
    quote: '從最後一排，走到門口迎接人。',
    story_full: '我個性很害羞，以前聚會都坐在最後、最早離開。上了服事裝備課程後，我鼓起勇氣加入招待團隊。\n\n第一天我緊張到手心冒汗，但一位新朋友對我說謝謝。原來簡單的一句「歡迎你來」，也可以是神使用的方式。',
  },
  {
    id: 't21', name: '宏恩', avatar_url: avatar(21), video_id: null, synthetic: true,
    quote: '我以為信仰是週日的事，後來發現是每一天。',
    story_full: '我從小在教會長大，但一直只是週日出席。出社會後第一份工作很不順，我開始在午休時間讀經。\n\n小組長每週陪我讀一章，我第一次發現聖經跟我的生活有關。現在我也在公司帶一個午餐讀經小組。',
  },
  {
    id: 't22', name: '婉婷', avatar_url: avatar(22), video_id: null, synthetic: true,
    quote: '孩子出生後，教會成了我們的娘家。',
    story_full: '老大出生那年，我們兩個新手爸媽什麼都不懂。小組的姊妹輪流送飯，還有人半夜回我的育兒訊息。\n\n現在換我們家打開門，陪新婚的小夫妻吃飯。被照顧過，才知道怎麼照顧人。',
  },
  {
    id: 't23', name: '子晴', avatar_url: avatar(23), video_id: null, synthetic: true,
    quote: '我在敬拜裡重新找回唱歌的理由。',
    story_full: '音樂系畢業後，我一度很怕唱歌，因為每次都在被評分。朋友邀我加入敬拜團，我猶豫了很久。\n\n第一次站上去，我發現這裡沒有人在打分數，只有一群人一起向神獻上。我又開始喜歡唱歌了。',
  },
  {
    id: 't24', name: '立偉', avatar_url: avatar(24), video_id: null, synthetic: true,
    quote: '換工作那段空窗期，神的供應沒有遲到。',
    story_full: '去年公司裁員，我突然失去工作，房租和孩子的學費都壓在身上。小組每週為我禱告，也有人幫我改履歷。\n\n三個月後我找到新工作，時間剛好接上。回頭看，那段日子我學會的是信靠，不是焦慮。',
  },
  {
    id: 't25', name: '怡君', avatar_url: avatar(25), video_id: null, synthetic: true,
    quote: '我在兒童主日學看見信仰最單純的樣子。',
    story_full: '我原本只是想陪女兒上主日學，後來被拉進去當小幫手。孩子們禱告的方式直接又真誠。\n\n有個小男孩為他生病的阿嬤禱告，說「耶穌你一定聽得到」。那一刻我想，我也要這樣相信。',
  },
  {
    id: 't26', name: '浩然', avatar_url: avatar(26), video_id: null, synthetic: true,
    quote: '球場上認識的朋友，帶我走進教會。',
    story_full: '我每週六都去打籃球，球友裡有一群人打完球會一起吃早餐、聊彼此的生活。\n\n有一天他們問我要不要來聚會看看。我去了，也留下來了。原來信仰也可以從一場球開始。',
  },
  {
    id: 't27', name: '佩珊', avatar_url: avatar(27), video_id: null, synthetic: true,
    quote: '退休後，我找到新的使命。',
    story_full: '退休第一年，我每天在家不知道要做什麼。教會的長青團契邀我一起去探訪獨居的長輩。\n\n陪他們聊天、量血壓、唱詩歌，我發現自己還能被神使用。現在我的行事曆比上班時還滿。',
  },
  {
    id: 't28', name: '冠宇', avatar_url: avatar(28), video_id: null, synthetic: true,
    quote: '在線上小組，我第一次說出心裡的話。',
    story_full: '我住在南部，附近沒有我們的教會，就加入了線上小組。一開始我都把鏡頭關著。\n\n有一次大家分享最近的掙扎，我打開鏡頭說了自己的事。沒有人急著給答案，只是陪我禱告。',
  },
  {
    id: 't29', name: '書涵', avatar_url: avatar(29), video_id: null, synthetic: true,
    quote: '我從觀眾，變成了幕後的一份子。',
    story_full: '我很喜歡聚會，但總覺得自己只是來聽的。後來加入媒體團隊，學著操作攝影機和直播。\n\n每週看到線上觀看的人數，我知道有人正透過這個畫面聽見福音。原來站在幕後也是服事。',
  },
  {
    id: 't30', name: '明哲', avatar_url: avatar(30), video_id: null, synthetic: true,
    quote: '我和爸爸之間，終於有了一次好好的對話。',
    story_full: '我跟爸爸很多年沒有好好說話。上了家庭課程之後，我決定先開口向他道歉。\n\n那天晚上我們聊到很晚。關係沒有一夜改變，但那扇門打開了，我們開始一起吃週末的早餐。',
  },
  {
    id: 't31', name: '玉婷', avatar_url: avatar(31), video_id: null, synthetic: true,
    quote: '從沒想過，我會在監所裡分享盼望。',
    story_full: '我加入外展團隊，第一次跟著去探訪時很緊張，不知道能說什麼。\n\n一位受刑人聽完詩歌後跟我說，這是她這個月最期待的一天。我才明白，陪伴本身就是一份禮物。',
  },
  {
    id: 't32', name: '嘉玲', avatar_url: avatar(32), video_id: null, synthetic: true,
    quote: '移居新城市，我第一個認識的就是小組。',
    story_full: '因為先生工作調動，我們搬到台中，什麼人都不認識。週日來到教會，招待同工幫我們找到附近的小組。\n\n第一次聚會就有人約我們週末去爬山。一個陌生的城市，很快就有了家的感覺。',
  },
  {
    id: 't33', name: '育誠', avatar_url: avatar(33), video_id: null, synthetic: true,
    quote: '我在服事中學會了等候。',
    story_full: '我個性急，做什麼都想馬上看到結果。在青年團契帶小組的頭一年，常常覺得沒有進展。\n\n直到有個組員在受洗時說，是那一年的陪伴讓他留下來。我才知道，神做工的時間比我想的更長。',
  },
  {
    id: 't34', name: '筱涵', avatar_url: avatar(34), video_id: null, synthetic: true,
    quote: '畢業那年的迷惘，在禱告裡找到方向。',
    story_full: '大學畢業時我不知道自己要做什麼，看著同學一個個找到工作，壓力很大。\n\n小組陪我一起禱告了好幾個月。後來我走進了社工的領域，每天的工作都提醒我，這是神放在我心裡的負擔。',
  },
  {
    id: 't35', name: 'Grace', avatar_url: avatar(35), video_id: null, synthetic: true,
    quote: 'I found a family before I found the words to pray.',
    story_full: '我在國外長大，回台灣工作時中文禱告說得很卡。小組的大家不在意，總是耐心等我說完。\n\n現在我每週帶雙語的禱告時間，陪伴跟我一樣在兩種語言之間的人。',
  },
  {
    id: 't36', name: '雅琪', avatar_url: avatar(36), video_id: null, synthetic: true,
    quote: '一場聖誕節的邀請，改變了我們全家。',
    story_full: '那年聖誕節，鄰居邀我們全家來看兒童詩班的表演。孩子很喜歡，吵著下週還要來。\n\n就這樣，我們從陪孩子來，到自己也想認識神。今年我和先生一起上了新朋友課程。',
  },
  {
    id: 't37', name: '柏宇', avatar_url: avatar(37), video_id: null, synthetic: true,
    quote: '我曾經以為，自己不值得被愛。',
    story_full: '高中那幾年，我總覺得自己哪裡都做不好。一位學長在營會裡跟我說，神愛我不是因為我表現好。\n\n那句話我聽了很久才相信。現在我在學生團契服事，想把同一句話說給學弟妹聽。',
  },
  {
    id: 't38', name: '宜蓁', avatar_url: avatar(38), video_id: null, synthetic: true,
    quote: '病床旁的禱告，讓我不再害怕。',
    story_full: '去年我住院開刀，手術前一晚非常害怕。小組長下班後趕來醫院，握著我的手禱告。\n\n手術很順利，但我更記得的是那一晚的平安。那份平安，到現在都還陪著我。',
  },
  {
    id: 't39', name: '俊宏', avatar_url: avatar(39), video_id: null, synthetic: true,
    quote: '我在 Hope Week 裡看見城市的需要。',
    story_full: '我第一次參加 Hope Week，是去社區幫忙整理一位獨居長輩的家。原本只想做完就走。\n\n阿伯一直跟我們道謝，還說好久沒有人來看他了。從那天起，我每個月都會回去陪他吃一頓飯。',
  },
  {
    id: 't40', name: '惠文', avatar_url: avatar(40), video_id: null, synthetic: true,
    quote: '四十歲受洗，一點都不晚。',
    story_full: '我一直覺得信仰是年輕人的事，自己已經定型了。女兒受洗那天，我在台下哭得比她還厲害。\n\n後來我也上了課程，在四十歲生日那個月受洗。原來神的時間表，從來不分年紀。',
  },
  {
    id: 't41', name: 'Ethan', avatar_url: avatar(41), video_id: null, synthetic: true,
    quote: '從看直播的陌生人，到線上小組的組長。',
    story_full: '疫情那年我在家裡看直播，一開始只是放著當背景音樂。後來我開始留言，也加入了線上小組。\n\n兩年後我成了組長，帶著住在不同城市的組員一起讀經。螢幕兩端，是同一個家。',
  },
  {
    id: 't42', name: '莉婷', avatar_url: avatar(42), video_id: null, synthetic: true,
    quote: '我學會把感謝說出口。',
    story_full: '我以前很少跟家人說謝謝，總覺得不好意思。小組有一次的作業，是每天寫下一件感謝的事。\n\n寫了一個月，我發現自己的眼光變了。現在每天睡前，我都會跟孩子一起說出今天的感謝。',
  },
  {
    id: 't43', name: '文彬', avatar_url: avatar(43), video_id: null, synthetic: true,
    quote: '一杯咖啡的時間，讓我留在教會。',
    story_full: '第一次來聚會，我打算聚會一結束就離開。一位弟兄在門口遞給我一杯咖啡，問我最近好嗎。\n\n那杯咖啡喝了一個小時。我後來才知道，他每週都會留下來等新朋友。現在，換我在門口遞咖啡。',
  },
];
