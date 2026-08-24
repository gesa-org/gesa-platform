// Phase 53 — bundled English→Hebrew dictionary, checked by
// TranslationProvider.tsx *before* it ever calls /api/translate.
//
// Why this exists: the live translation feature (Phase 33) was built
// entirely around the Google Cloud Translation API (lib/translate.ts),
// which requires a paid, billed `GOOGLE_TRANSLATE_API_KEY`. That env var
// was never actually set in this project (checked `.env.local` and
// `.env.example` directly), so every call silently fell back to
// returning the original English text unchanged — which is exactly why
// switching to Hebrew visibly did nothing. Getting a real API key set up
// is still worth doing (it's the only way dynamic, per-record content
// like therapist bios or blog posts can ever be translated), but this
// dictionary makes the feature actually work *today*, with zero paid API
// dependency, for the static marketing copy that makes up the vast
// majority of what a visitor reads on Home, About, Our Therapists,
// Support Groups, the header, and the footer.
//
// Keys are the exact live English strings (the fallback copy in
// lib/content.ts / each component's own *_FALLBACK object) — if that
// English copy changes, its Hebrew entry here needs updating too, same
// as any other hardcoded pair of matching strings. Entries repeated
// verbatim across pages (e.g. "Verified Professionals") only need one
// dictionary entry since the lookup is by exact text, not by page.
//
// The one dynamic exception: `copyrightLine` contains a live `{year}`.
// TranslationProvider normalizes any 4-digit year in the source text to
// the literal token "{year}" before looking it up here, then substitutes
// the real year back into the Hebrew result — so this dictionary only
// ever needs the one templated entry, not one per calendar year.
export const HE_DICTIONARY: Record<string, string> = {
  // --- Header ---
  Home: "בית",
  About: "אודות",
  "Our Therapists": "המטפלים שלנו",
  "Support Groups": "קבוצות תמיכה",
  Donate: "תרומה",

  // --- Footer ---
  "Free, professional, culturally sensitive mental health support, delivered by a global network of verified volunteer therapists.":
    "תמיכה נפשית מקצועית, חינמית ורגישה תרבותית, המסופקת על ידי רשת עולמית של מטפלים מתנדבים מאושרים.",
  Explore: "ניווט",
  Blog: "בלוג",
  Soon: "בקרוב",
  FAQ: "שאלות נפוצות",
  Contact: "צור קשר",
  Support: "תמיכה",
  "Find a Therapist": "מצאו מטפל",
  "Join a Group": "הצטרפו לקבוצה",
  Volunteer: "התנדבות",
  "Emergency Contact": "מספר חירום",
  Legal: "משפטי",
  "Privacy Policy": "מדיניות פרטיות",
  "Cookies Policy": "מדיניות עוגיות",
  "Legal Notice": "הודעה משפטית",
  "Accessibility Statement": "הצהרת נגישות",
  "Terms & Conditions": "תנאי שימוש",
  "© {year} GESA (Global Emotional Support Alliance). A registered non-profit organization.":
    "© {year} GESA (הברית העולמית לתמיכה נפשית). עמותה רשומה.",
  "Made with care for those on the path to healing.": "נבנה בתשומת לב לכל מי שבדרך להחלמה.",

  // --- Home (components/home/Paths.tsx) ---
  "A global volunteer support alliance": "ברית עולמית של מתנדבים לתמיכה נפשית",
  "Two clicks to a therapist who understands": "שני קליקים למטפל שמבין אותך",
  "GESA (Global Emotional Support Alliance) connects you with a verified volunteer therapist for a free, confidential session — no forms, no accounts, no questions upfront. Choose the path below that fits you and confirm.":
    "GESA (הברית העולמית לתמיכה נפשית) מקשרת אתכם למטפל מתנדב מאושר לפגישה חינמית וחסויה — בלי טפסים, בלי חשבונות, בלי שאלות מקדימות. בחרו את המסלול המתאים לכם למטה ואשרו.",
  "Verified Professionals": "אנשי מקצוע מאושרים",
  "100% Free Sessions": "פגישות ללא עלות ב-100%",
  "Global Community": "קהילה עולמית",
  "Free, confidential sessions · verified volunteer therapists · secure communication":
    "פגישות חינמיות וחסויות · מטפלים מתנדבים מאושרים · תקשורת מאובטחת",
  "Because no one should face emotional pain alone": "כי אף אחד לא צריך להתמודד עם כאב נפשי לבד",
  "Verified volunteer therapists, giving their time freely": "מטפלים מתנדבים מאושרים, שנותנים מזמנם בהתנדבות",
  "Up to six free sessions — cost is never why someone goes without care":
    "עד שש פגישות חינמיות — עלות כספית לא תהיה הסיבה שמישהו יישאר בלי טיפול",
  "A global community of care, across borders and languages": "קהילה עולמית של דאגה, מעבר לגבולות ולשפות",
  "Confidential, dignified support, always free at the point of need": "תמיכה חסויה ומכבדת, תמיד חינמית בעת הצורך",
  "In crisis right now": "במשבר כרגע",
  "For anyone shaken by war, terror, or disaster. Fast, gentle help when you can't wait — approximately six free sessions to start.":
    "לכל מי שחווה זעזוע ממלחמה, טרור או אסון. עזרה מהירה ורגישה כשאי אפשר לחכות — כשש פגישות חינמיות להתחלה.",
  "Reach out now": "צרו קשר עכשיו",
  "Veterans, reservists & families": "חיילים משוחררים, מילואימניקים ומשפחות",
  "For the long shadow of service — adjustment, ongoing stress, trauma, and the strain on families. Unlimited free sessions for veterans and reservists; families receive a structured package of sessions.":
    "לצל הארוך של השירות — הסתגלות, מתח מתמשך, טראומה והעומס על המשפחות. פגישות חינמיות ללא הגבלה לחיילים משוחררים ולמילואימניקים; משפחות מקבלות חבילת פגישות מובנית.",
  "Seeking support": "מחפשים תמיכה",
  "For anyone carrying anxiety, ongoing stress, or the weight of antisemitism. Start here — more is coming.":
    "לכל מי שסוחב חרדה, מתח מתמשך או את הכובד של אנטישמיות. התחילו כאן — יש עוד בדרך.",

  // --- About Hero (components/Hero.tsx) ---
  "The path to emotional recovery begins here": "הדרך להחלמה נפשית מתחילה כאן",
  "GESA (Global Emotional Support Alliance) connects you with a verified volunteer therapist for free, culturally sensitive emotional support.":
    "GESA (הברית העולמית לתמיכה נפשית) מקשרת אתכם למטפל מתנדב מאושר לתמיכה נפשית חינמית ורגישה תרבותית.",
  "Find your therapist": "מצאו את המטפל שלכם",
  "Explore support groups": "גלו קבוצות תמיכה",

  // --- About sections (lib/content.ts ABOUT_SECTIONS_FALLBACK) ---
  "Why GESA exists": "למה GESA קיימת",
  "Millions of people carry pain that has nowhere to go — after displacement, loss, or the quiet exhaustion of staying strong for others. GESA exists to meet that pain with warmth, dignity, and real professional care.":
    "מיליוני אנשים סוחבים כאב שאין לו לאן ללכת — אחרי עקירה, אובדן, או התשות השקטה של להיות חזקים בשביל אחרים. GESA קיימת כדי לפגוש את הכאב הזה בחמימות, בכבוד ובטיפול מקצועי אמיתי.",
  "We bring skilled therapists to the people who need them most, across borders and languages, and we keep it free at the point of need so that ability to pay is never the reason someone goes without support.":
    "אנחנו מביאים מטפלים מקצועיים לאנשים שזקוקים להם ביותר, מעבר לגבולות ולשפות, ושומרים על כך חינמי בעת הצורך כדי שהיכולת לשלם לא תהיה הסיבה שמישהו יישאר בלי תמיכה.",
  "How GESA works": "איך GESA עובדת",
  "Verified volunteer therapists": "מטפלים מתנדבים מאושרים",
  "A global community of credential-checked professionals who donate their time.":
    "קהילה עולמית של אנשי מקצוע מאומתי הכשרה, שמתנדבים מזמנם.",
  "Up to six free sessions": "עד שש פגישות חינמיות",
  "Every person receives six sessions at no cost, with continued support afterward at a reduced donation fee.":
    "כל אדם מקבל שש פגישות ללא עלות, עם המשך תמיכה לאחר מכן בתרומה מוזלת.",
  "Thoughtful matching": "התאמה מתחשבת",
  "We pair each person with a therapist who fits their needs, language, and preferences.":
    "אנחנו מתאימים לכל אדם מטפל שמתאים לצרכיו, לשפתו ולהעדפותיו.",
  "Global reach, 20+ languages": "פריסה עולמית, מעל 20 שפות",
  "Support that crosses time zones and speaks your language, online and confidential.":
    "תמיכה שחוצה אזורי זמן ומדברת בשפה שלך, מקוונת וחסויה.",
  "Our Founders": "המייסדות שלנו",
  "Meet the founders behind GESA — a global home for free, trauma-informed emotional support.":
    "הכירו את המייסדות שמאחורי GESA — בית עולמי לתמיכה נפשית חינמית ומודעת טראומה.",
  "Co-Founder, GESA": "מייסדת שותפה, GESA",
  "Ilana helped establish GESA out of a conviction that no one should face emotional pain alone or be priced out of care. She guides the alliance's mission of warm, accessible support and its growing worldwide community of volunteer therapists.":
    "אילנה עזרה להקים את GESA מתוך אמונה שאף אחד לא צריך להתמודד עם כאב נפשי לבד או להיות מנוע מטיפול בשל עלות. היא מובילה את משימת הברית לתמיכה חמה ונגישה ואת קהילת המטפלים המתנדבים הגדלה שלה בעולם.",
  "Karin co-founded GESA to connect skilled, compassionate therapists with people carrying the weight of war, displacement, and antisemitism. She leads the community and partnerships that keep six sessions free for everyone who reaches out.":
    "קארין הקימה במשותף את GESA כדי לקשר מטפלים מקצועיים ואכפתיים עם אנשים שנושאים את כובד המלחמה, העקירה והאנטישמיות. היא מובילה את הקהילה והשותפויות ששומרות על שש פגישות חינמיות לכל מי שפונה.",
  "Join us as a caregiver": "הצטרפו אלינו כמתנדבים",
  "Are you a licensed therapist with a few hours a month to give? Your time becomes someone's turning point. Join a global network making care free and human.":
    "האם אתם מטפלים מוסמכים עם כמה שעות בחודש לתת? הזמן שלכם יכול להיות נקודת המפנה של מישהו. הצטרפו לרשת עולמית שהופכת את הטיפול לחינמי ואנושי.",
  "Become a volunteer therapist": "הפכו למטפלים מתנדבים",
  "GESA is a registered nonprofit connecting volunteer emotional-support specialists worldwide with Israelis facing war-related distress and Jewish communities abroad experiencing antisemitism.":
    "GESA היא עמותה רשומה המקשרת בין אנשי מקצוע מתנדבים לתמיכה נפשית בעולם לבין ישראלים החווים מצוקה בעקבות המלחמה וקהילות יהודיות בתפוצות החוות אנטישמיות.",
  "Donations are tax-deductible in Israel, the U.S., the U.K., and Spain.":
    "תרומות מוכרות לצורכי מס בישראל, בארצות הברית, בבריטניה ובספרד.",

  // --- Our Therapists page (lib/content.ts + TherapistsDirectory.tsx) ---
  "Our Specialists": "המומחים שלנו",
  "Browse our network of verified volunteer therapists. Search and filter to find the right fit, then open a profile to read more and book.":
    "עיינו ברשת המטפלים המתנדבים המאושרים שלנו. חפשו וסננו כדי למצוא את ההתאמה הנכונה, ואז פתחו פרופיל לקריאה נוספת ולתיאום פגישה.",
  "Search by name": "חיפוש לפי שם",
  "Find therapist…": "מצאו מטפל…",
  "Definition of a therapist": "הגדרת מטפל",
  Any: "הכל",
  Language: "שפה",
  "Any language": "כל שפה",
  "Meeting duration": "משך הפגישה",
  Gender: "מגדר",
  Male: "זכר",
  Female: "נקבה",
  "Non-binary": "לא בינארי",
  "No preference": "אין העדפה",
  "Join us as a therapist": "הצטרפו אלינו כמטפלים",
  "Apply filters": "החל מסננים",
  "No therapists match your search right now. Try clearing a filter, or contact us and we'll help you find the right person.":
    "אין כרגע מטפלים שמתאימים לחיפוש שלכם. ניתן לנקות מסנן, או לפנות אלינו ואנחנו נעזור לכם למצוא את האדם המתאים.",

  // --- Support Groups page (lib/content.ts + SupportGroupsInteractive.tsx) ---
  "Facilitated circles for collective healing": "מעגלים בהנחיה להחלמה קולקטיבית",
  "Online and in-person groups, guided by verified facilitators. You are welcome exactly as you are.":
    "קבוצות מקוונות ופרונטליות, בהנחיית מנחים מאושרים. אתם מוזמנים בדיוק כמו שאתם.",
  "No support groups are open for registration right now — check back soon.":
    "אין כרגע קבוצות תמיכה פתוחות להרשמה — בקרו שוב בקרוב.",
  Register: "הרשמה",
  "Confirm registration": "אישור הרשמה",
  "You're registered": "נרשמתם בהצלחה",

  // --- FAQ / Contact / Blog (lib/content.ts SimplePageContent fallbacks) ---
  "Frequently asked questions": "שאלות נפוצות",
  "We're here to help": "אנחנו כאן לעזור",
  "Questions about support, volunteering, or donating — send us a note and we'll get back to you.":
    "שאלות בנוגע לתמיכה, התנדבות או תרומה — שלחו לנו הודעה ונחזור אליכם.",
  "In the Press & Resources": "בתקשורת ומשאבים",
  "Updates from GESA, and resources from our network of volunteer therapists.":
    "עדכונים מ-GESA, ומשאבים מרשת המטפלים המתנדבים שלנו.",

  // --- Stats (components/home/Stats.tsx) ---
  "Verified therapists": "מטפלים מאושרים",
  "Free sessions each": "פגישות חינמיות לכל אחד",
  "Languages supported": "שפות נתמכות",
  "Support circles": "מעגלי תמיכה",
  Global: "עולמי",
};

// Any 4-digit year (1900–2099) — used to normalize a string like
// "© 2026 GESA..." to "© {year} GESA..." before the dictionary lookup, so
// one dictionary entry keeps working every calendar year without an
// annual edit.
const YEAR_PATTERN = /\b(19|20)\d{2}\b/;

// Looks up `text` in the bundled dictionary, transparently handling the
// one templated ("{year}") entry. Returns undefined (never the original
// text) when there's no match, so callers can tell "found" apart from
// "found, and happens to translate to itself."
export function lookupHeDictionary(text: string): string | undefined {
  const direct = HE_DICTIONARY[text];
  if (direct !== undefined) return direct;

  const yearMatch = text.match(YEAR_PATTERN);
  if (yearMatch) {
    const templated = text.replace(yearMatch[0], "{year}");
    const templatedHe = HE_DICTIONARY[templated];
    if (templatedHe !== undefined) return templatedHe.replace("{year}", yearMatch[0]);
  }

  return undefined;
}
