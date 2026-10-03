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
// Since 3 Oct (afternoon) each note carries its own download button (Sean: "include
// that downloadable button and make sure the button is translated"), so the notes
// say "below" rather than "once inside, use Corpus for AI". The English line, for
// English browsers and languages without a note, is unchanged.
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
  /** The download button's label, in the language. */
  button: string;
};

const WELCOMES: Record<string, LanguageWelcome> = {
  "zh-Hans": {
    lang: "zh-Hans",
    name: "Chinese",
    hello: "欢迎",
    text: "本档案以英文撰写。可通过下方按钮下载完整档案的纯文本文件；用翻译工具或 AI 助手翻译这些文件，比翻译网页更完整。您的浏览器也可以直接翻译这些页面。",
    button: "下载完整档案",
  },
  "zh-Hant": {
    lang: "zh-Hant",
    name: "Chinese",
    hello: "歡迎",
    text: "本檔案以英文撰寫。可透過下方按鈕下載完整檔案的純文字檔；用翻譯工具或 AI 助理翻譯這些檔案，比翻譯網頁更完整。您的瀏覽器也可以直接翻譯這些頁面。",
    button: "下載完整檔案",
  },
  es: {
    lang: "es",
    name: "Spanish",
    hello: "Bienvenida",
    text: "Este archivo está escrito en inglés. Descargue abajo el archivo completo en archivos de texto sin formato: las herramientas de traducción y los asistentes de IA los traducen de forma más completa que las páginas web. Su navegador también puede traducir estas páginas.",
    button: "Descargar el archivo",
  },
  fr: {
    lang: "fr",
    name: "French",
    hello: "Bienvenue",
    text: "Ces archives sont rédigées en anglais. Téléchargez ci-dessous l’ensemble des archives sous forme de fichiers texte : les outils de traduction et les assistants d’IA les traduisent plus complètement que les pages web. Votre navigateur peut aussi traduire ces pages.",
    button: "Télécharger les archives",
  },
  de: {
    lang: "de",
    name: "German",
    hello: "Willkommen",
    text: "Dieses Archiv ist auf Englisch verfasst. Laden Sie unten das gesamte Archiv als reine Textdateien herunter: Übersetzungsprogramme und KI-Assistenten übersetzen sie vollständiger als Webseiten. Ihr Browser kann diese Seiten auch übersetzen.",
    button: "Archiv herunterladen",
  },
  pt: {
    lang: "pt",
    name: "Portuguese",
    hello: "Boas-vindas",
    text: "Este arquivo está escrito em inglês. Baixe abaixo o arquivo completo em arquivos de texto simples: ferramentas de tradução e assistentes de IA os traduzem de forma mais completa do que as páginas da web. Seu navegador também pode traduzir estas páginas.",
    button: "Baixar o arquivo",
  },
  ja: {
    lang: "ja",
    name: "Japanese",
    hello: "ようこそ",
    text: "このアーカイブは英語で書かれています。下のボタンからアーカイブ全体をプレーンテキストのファイルとしてダウンロードできます。翻訳ツールやAIアシスタントを使えば、ウェブページよりも完全に翻訳できます。ブラウザでこれらのページを翻訳することもできます。",
    button: "アーカイブをダウンロード",
  },
  ko: {
    lang: "ko",
    name: "Korean",
    hello: "환영합니다",
    text: "이 아카이브는 영어로 작성되었습니다. 아래 버튼으로 아카이브 전체를 일반 텍스트 파일로 내려받을 수 있습니다. 번역 도구나 AI 어시스턴트로 번역하면 웹페이지보다 더 완전하게 번역됩니다. 브라우저에서 이 페이지를 바로 번역할 수도 있습니다.",
    button: "아카이브 내려받기",
  },
  ru: {
    lang: "ru",
    name: "Russian",
    hello: "Добро пожаловать",
    text: "Этот архив написан на английском языке. Скачайте ниже весь архив в виде текстовых файлов: инструменты перевода и ИИ-ассистенты переводят их полнее, чем веб-страницы. Ваш браузер также может перевести эти страницы.",
    button: "Скачать архив",
  },
  ar: {
    lang: "ar",
    name: "Arabic",
    dir: "rtl",
    hello: "مرحبًا بكم",
    text: "هذا الأرشيف مكتوب باللغة الإنجليزية. نزّل الأرشيف كاملًا من الزر أدناه في ملفات نصية بسيطة؛ إذ تترجمها أدوات الترجمة ومساعدو الذكاء الاصطناعي بصورة أكمل من صفحات الويب. ويمكن لمتصفحك أيضًا ترجمة هذه الصفحات.",
    button: "تنزيل الأرشيف",
  },
  hi: {
    lang: "hi",
    name: "Hindi",
    hello: "स्वागत है",
    text: "यह संग्रह अंग्रेज़ी में लिखा गया है। नीचे दिए बटन से पूरा संग्रह सादे टेक्स्ट फ़ाइलों के रूप में डाउनलोड करें; अनुवाद टूल और AI सहायक इनका अनुवाद वेब पेजों की तुलना में अधिक पूर्ण रूप से करते हैं। आपका ब्राउज़र भी इन पेजों का अनुवाद कर सकता है।",
    button: "संग्रह डाउनलोड करें",
  },
  fa: {
    lang: "fa",
    name: "Persian",
    dir: "rtl",
    hello: "خوش آمدید",
    text: "این بایگانی به زبان انگلیسی نوشته شده است. با دکمهٔ زیر کل بایگانی را به‌صورت فایل‌های متنی ساده دانلود کنید؛ ابزارهای ترجمه و دستیارهای هوش مصنوعی این فایل‌ها را کامل‌تر از صفحات وب ترجمه می‌کنند. مرورگر شما نیز می‌تواند این صفحات را ترجمه کند.",
    button: "دانلود بایگانی",
  },
  tr: {
    lang: "tr",
    name: "Turkish",
    hello: "Hoş geldiniz",
    text: "Bu arşiv İngilizce yazılmıştır. Arşivin tamamını aşağıdaki düğmeyle düz metin dosyaları olarak indirin; çeviri araçları ve yapay zekâ asistanları bu dosyaları web sayfalarından daha eksiksiz çevirir. Tarayıcınız da bu sayfaları çevirebilir.",
    button: "Arşivi indir",
  },
  vi: {
    lang: "vi",
    name: "Vietnamese",
    hello: "Chào mừng",
    text: "Kho lưu trữ này được viết bằng tiếng Anh. Hãy tải toàn bộ kho lưu trữ bằng nút bên dưới, dưới dạng tệp văn bản thuần; các công cụ dịch và trợ lý AI dịch những tệp này đầy đủ hơn so với trang web. Trình duyệt của bạn cũng có thể dịch các trang này.",
    button: "Tải kho lưu trữ",
  },
  id: {
    lang: "id",
    name: "Indonesian",
    hello: "Selamat datang",
    text: "Arsip ini ditulis dalam bahasa Inggris. Unduh seluruh arsip sebagai file teks biasa dengan tombol di bawah; alat penerjemah dan asisten AI menerjemahkannya lebih lengkap daripada halaman web. Peramban Anda juga dapat menerjemahkan halaman-halaman ini.",
    button: "Unduh arsip",
  },
  it: {
    lang: "it",
    name: "Italian",
    hello: "Benvenuti",
    text: "Questo archivio è scritto in inglese. Scaricate qui sotto l’intero archivio come file di testo semplice: gli strumenti di traduzione e gli assistenti di IA li traducono in modo più completo rispetto alle pagine web. Anche il vostro browser può tradurre queste pagine.",
    button: "Scarica l’archivio",
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
