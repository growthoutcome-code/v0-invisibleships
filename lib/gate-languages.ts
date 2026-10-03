// The gate's note for readers in other languages. 3 October 2026.
//
// Sean asked for one or two sentences on the gate's first screen pointing overseas
// readers to the download, because plain-text files translate more completely
// than web pages. Readers whose browser is set to English see the English line.
// Everyone else sees the same message in their own language, if it is one of the
// languages below, and the English line if it is not.
//
// HOW THE LANGUAGE IS CHOSEN: from the browser's own language setting
// (navigator.languages), which every browser reports to every site. Not location,
// not a question in the gate, nothing stored by this site. The gate must not ask
// for more (CLAUDE.md §2: no gate fields to fill gaps in measurement).
//
// THE TRANSLATIONS ARE AI-DRAFTED AND UNREVIEWED (3 Oct 2026). Have a native
// speaker check any of them before relying on it, and replace the text here.
// The brand names stay in English on purpose: "Corpus for AI" is the label the
// reader will look for on the page.
//
// Navigation-type text, not archive content, so it is not exported to the
// download (CLAUDE.md §6).

export const CORPUS_LINE =
  "Reading in another language? Once inside, use Corpus for AI to download the whole archive as plain-text files, which translation tools and AI assistants handle more completely than web pages.";

export type LanguageWelcome = {
  /** BCP-47 tag for the lang attribute. */
  lang: string;
  /** English name, for the line that says why the note is shown. */
  name: string;
  dir?: "rtl";
  /** "Welcome", in the language. */
  hello: string;
  text: string;
};

const WELCOMES: Record<string, LanguageWelcome> = {
  "zh-Hans": {
    lang: "zh-Hans",
    name: "Chinese",
    hello: "欢迎",
    text: "本档案以英文撰写。进入后，可通过“Corpus for AI”下载完整档案的纯文本文件；用翻译工具或 AI 助手翻译这些文件，比翻译网页更完整。您的浏览器也可以直接翻译这些页面。",
  },
  "zh-Hant": {
    lang: "zh-Hant",
    name: "Chinese",
    hello: "歡迎",
    text: "本檔案以英文撰寫。進入後，可透過「Corpus for AI」下載完整檔案的純文字檔；用翻譯工具或 AI 助理翻譯這些檔案，比翻譯網頁更完整。您的瀏覽器也可以直接翻譯這些頁面。",
  },
  es: {
    lang: "es",
    name: "Spanish",
    hello: "Bienvenida",
    text: "Este archivo está escrito en inglés. Una vez dentro, use «Corpus for AI» para descargar el archivo completo en archivos de texto sin formato; las herramientas de traducción y los asistentes de IA los traducen de forma más completa que las páginas web. Su navegador también puede traducir estas páginas.",
  },
  fr: {
    lang: "fr",
    name: "French",
    hello: "Bienvenue",
    text: "Ces archives sont rédigées en anglais. Une fois entré, utilisez « Corpus for AI » pour télécharger l’ensemble des archives sous forme de fichiers texte ; les outils de traduction et les assistants d’IA les traduisent plus complètement que les pages web. Votre navigateur peut aussi traduire ces pages.",
  },
  de: {
    lang: "de",
    name: "German",
    hello: "Willkommen",
    text: "Dieses Archiv ist auf Englisch verfasst. Nach dem Eintreten können Sie über „Corpus for AI“ das gesamte Archiv als reine Textdateien herunterladen; Übersetzungsprogramme und KI-Assistenten übersetzen sie vollständiger als Webseiten. Ihr Browser kann diese Seiten auch übersetzen.",
  },
  pt: {
    lang: "pt",
    name: "Portuguese",
    hello: "Boas-vindas",
    text: "Este arquivo está escrito em inglês. Depois de entrar, use “Corpus for AI” para baixar o arquivo completo em arquivos de texto simples; ferramentas de tradução e assistentes de IA os traduzem de forma mais completa do que as páginas da web. Seu navegador também pode traduzir estas páginas.",
  },
  ja: {
    lang: "ja",
    name: "Japanese",
    hello: "ようこそ",
    text: "このアーカイブは英語で書かれています。入場後、「Corpus for AI」からアーカイブ全体をプレーンテキストのファイルとしてダウンロードできます。翻訳ツールやAIアシスタントを使えば、ウェブページよりも完全に翻訳できます。ブラウザでこれらのページを翻訳することもできます。",
  },
  ko: {
    lang: "ko",
    name: "Korean",
    hello: "환영합니다",
    text: "이 아카이브는 영어로 작성되었습니다. 입장한 후 ‘Corpus for AI’에서 아카이브 전체를 일반 텍스트 파일로 내려받을 수 있습니다. 번역 도구나 AI 어시스턴트로 번역하면 웹페이지보다 더 완전하게 번역됩니다. 브라우저에서 이 페이지를 바로 번역할 수도 있습니다.",
  },
  ru: {
    lang: "ru",
    name: "Russian",
    hello: "Добро пожаловать",
    text: "Этот архив написан на английском языке. После входа скачайте весь архив в виде текстовых файлов через «Corpus for AI»: инструменты перевода и ИИ-ассистенты переводят их полнее, чем веб-страницы. Ваш браузер также может перевести эти страницы.",
  },
  ar: {
    lang: "ar",
    name: "Arabic",
    dir: "rtl",
    hello: "مرحبًا بكم",
    text: "هذا الأرشيف مكتوب باللغة الإنجليزية. بعد الدخول، استخدم «Corpus for AI» لتنزيل الأرشيف كاملًا في ملفات نصية بسيطة؛ إذ تترجمها أدوات الترجمة ومساعدو الذكاء الاصطناعي بصورة أكمل من صفحات الويب. ويمكن لمتصفحك أيضًا ترجمة هذه الصفحات.",
  },
  hi: {
    lang: "hi",
    name: "Hindi",
    hello: "स्वागत है",
    text: "यह संग्रह अंग्रेज़ी में लिखा गया है। प्रवेश करने के बाद, “Corpus for AI” से पूरा संग्रह सादे टेक्स्ट फ़ाइलों के रूप में डाउनलोड करें; अनुवाद टूल और AI सहायक इनका अनुवाद वेब पेजों की तुलना में अधिक पूर्ण रूप से करते हैं। आपका ब्राउज़र भी इन पेजों का अनुवाद कर सकता है।",
  },
  // Added 3 Oct 2026 at Sean's request. Same caveat: AI-drafted, unreviewed.
  fa: {
    lang: "fa",
    name: "Persian",
    dir: "rtl",
    hello: "خوش آمدید",
    text: "این بایگانی به زبان انگلیسی نوشته شده است. پس از ورود، با «Corpus for AI» کل بایگانی را به‌صورت فایل‌های متنی ساده دانلود کنید؛ ابزارهای ترجمه و دستیارهای هوش مصنوعی این فایل‌ها را کامل‌تر از صفحات وب ترجمه می‌کنند. مرورگر شما نیز می‌تواند این صفحات را ترجمه کند.",
  },
  tr: {
    lang: "tr",
    name: "Turkish",
    hello: "Hoş geldiniz",
    text: "Bu arşiv İngilizce yazılmıştır. Girdikten sonra, arşivin tamamını düz metin dosyaları olarak indirmek için «Corpus for AI» bölümünü kullanın; çeviri araçları ve yapay zekâ asistanları bu dosyaları web sayfalarından daha eksiksiz çevirir. Tarayıcınız da bu sayfaları çevirebilir.",
  },
  vi: {
    lang: "vi",
    name: "Vietnamese",
    hello: "Chào mừng",
    text: "Kho lưu trữ này được viết bằng tiếng Anh. Sau khi vào, hãy dùng “Corpus for AI” để tải toàn bộ kho lưu trữ dưới dạng tệp văn bản thuần; các công cụ dịch và trợ lý AI dịch những tệp này đầy đủ hơn so với trang web. Trình duyệt của bạn cũng có thể dịch các trang này.",
  },
  id: {
    lang: "id",
    name: "Indonesian",
    hello: "Selamat datang",
    text: "Arsip ini ditulis dalam bahasa Inggris. Setelah masuk, gunakan “Corpus for AI” untuk mengunduh seluruh arsip sebagai file teks biasa; alat penerjemah dan asisten AI menerjemahkannya lebih lengkap daripada halaman web. Peramban Anda juga dapat menerjemahkan halaman-halaman ini.",
  },
  it: {
    lang: "it",
    name: "Italian",
    hello: "Benvenuti",
    text: "Questo archivio è scritto in inglese. Una volta entrati, usate «Corpus for AI» per scaricare l’intero archivio come file di testo semplice: gli strumenti di traduzione e gli assistenti di IA li traducono in modo più completo rispetto alle pagine web. Anche il vostro browser può tradurre queste pagine.",
  },
};

/** Languages with a note, for the check script and the docs. */
export const WELCOME_LANGUAGES = Object.keys(WELCOMES);

/**
 * The note for the reader's first-choice browser language, or null when that
 * language is English or has no note. Only the first choice counts: a reader
 * whose browser lists English first reads English, whatever else is listed.
 */
export function welcomeFor(languages: readonly string[]): LanguageWelcome | null {
  const first = (languages[0] ?? "").trim();
  if (!first) return null;
  const tag = first.toLowerCase();
  const base = tag.split("-")[0];
  if (base === "en") return null;
  if (base === "zh") {
    // Traditional for Taiwan, Hong Kong and Macau, and anyone who asks for it.
    return /hant|-tw|-hk|-mo/.test(tag) ? WELCOMES["zh-Hant"] : WELCOMES["zh-Hans"];
  }
  // "in" is the old code some browsers still send for Indonesian.
  return WELCOMES[base === "in" ? "id" : base] ?? null;
}
