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
  // Phase 115 — Header.tsx's actual live CTA label is the fully-uppercase
  // literal "DONATE" (see HEADER_CONTENT_FALLBACK.donateLabel), a different
  // exact string than the sentence-case "Donate" above (dictionary lookup
  // is exact-string, not case-insensitive) — this was the concrete
  // regression a prior phase's audit found and this restores.
  DONATE: "תרומה",

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

  // --- Book a Session modal (components/intake/IntakeBookingModal.tsx,
  // Phase 54). Only the fully-static, single-text-node strings are listed
  // here — the two consent-checkbox sentences each split across multiple
  // DOM text nodes around an embedded link, so exact-match dictionary
  // lookup isn't reliable for those without live-browser verification of
  // how the text actually nodes out; they fall through to the (still
  // unconfigured) live API for now rather than risk a wrong partial match.
  "Choose a different therapist": "בחרו מטפל אחר",
  "Pick how you'd like to connect and a time that works.": "בחרו איך תרצו להתחבר ומועד שמתאים לכם.",
  "How should we connect you?": "איך נחבר אתכם?",
  "We'll confirm and follow up at your email.": "נאשר ונחזור אליכם באימייל.",
  "Message your therapist directly.": "שלחו הודעה ישירות למטפל שלכם.",
  "We'll email you a Zoom link before your session.": "נשלח לכם קישור לזום באימייל לפני הפגישה.",
  Date: "תאריך",
  Name: "שם",
  Email: "אימייל",
  City: "עיר",
  "Year of birth": "שנת לידה",
  "Checking availability…": "בודק זמינות…",
  "No open times this day — try another date.": "אין זמנים פנויים ביום זה — נסו תאריך אחר.",
  "Please choose a time.": "בחרו שעה.",
  "This therapist doesn't have WhatsApp connected yet — please choose Email or Zoom.":
    "למטפל הזה אין עדיין וואטסאפ מחובר — בחרו אימייל או זום.",
  "Please enter a valid year of birth.": "הזינו שנת לידה תקינה.",
  "You must be at least 18 years old to book a session.": "עליכם להיות מעל גיל 18 כדי לקבוע פגישה.",
  "Please agree to the terms and conditions and the privacy policy to continue.":
    "אנא אשרו את תנאי השימוש ומדיניות הפרטיות כדי להמשיך.",
  "Something went wrong. Please try again.": "משהו השתבש. נסו שוב.",
  "Booking…": "מבצע הזמנה…",
  "Book a Support Meeting": "קבעו פגישת תמיכה",
  "This slot is reserved the moment you confirm — no one else can take it.":
    "המקום משוריין ברגע האישור — אף אחד אחר לא יכול לתפוס אותו.",
  "Book a Session": "קביעת פגישה",

  // --- Stats (components/home/Stats.tsx) ---
  "Verified therapists": "מטפלים מאושרים",
  "Free sessions each": "פגישות חינמיות לכל אחד",
  "Languages supported": "שפות נתמכות",
  "Support circles": "מעגלי תמיכה",
  Global: "עולמי",

  // --- Donate page (components/donate/DonatePage.tsx DONATE_PAGE_FALLBACK) ---
  "Your Choice Creates Impact": "הבחירה שלכם יוצרת השפעה",
  "You can help meaningful support reach someone.": "אתם יכולים לעזור לתמיכה משמעותית להגיע למישהו.",
  "Across the world, professionals are choosing to gift their time, experience and expertise. Your contribution helps GESA bring that support to eligible people and communities across languages, cultures and borders.":
    "ברחבי העולם, אנשי מקצוע בוחרים לתרום מזמנם, מניסיונם ומהמומחיות שלהם. התרומה שלכם עוזרת ל-GESA להביא את התמיכה הזו לאנשים ולקהילות זכאיות, מעבר לשפות, תרבויות וגבולות.",
  "Their time is the gift. Your support helps it reach further.": "הזמן שלהם הוא המתנה. התמיכה שלכם עוזרת לה להגיע רחוק יותר.",
  "Make support possible": "אפשרו תמיכה",
  "Choose how you would like to contribute": "בחרו כיצד תרצו לתרום",
  "Give once": "תרומה חד פעמית",
  "Give monthly": "תרומה חודשית",
  "Custom amount": "סכום אחר",
  "Every contribution helps move gifted professional support from intention into action.":
    "כל תרומה עוזרת להפוך תמיכה מקצועית מתנדבת מכוונה למעשה.",
  "Make my gift": "בצעו את התרומה שלי",
  "What your gift helps make possible": "מה התרומה שלכם עוזרת לאפשר",
  Access: "נגישות",
  "Helping eligible people discover and enter the right support pathway.":
    "עוזר לאנשים זכאים לגלות ולהיכנס למסלול התמיכה הנכון.",
  Connection: "חיבור",
  "Bringing people and professionals together across language and distance.":
    "מחבר בין אנשים ואנשי מקצוע מעבר לשפה ולמרחק.",
  Continuity: "המשכיות",
  "Supporting the coordination and delivery of gifted support programmes.":
    "תומך בתיאום ובמסירה של תוכניות תמיכה מתנדבות.",
  "One choice can carry support across the world.": "בחירה אחת יכולה לשאת תמיכה סביב העולם.",
  "Your contribution becomes part of a global movement built by people who choose to give, participate and create meaningful change.":
    "התרומה שלכם הופכת לחלק מתנועה עולמית שנבנתה על ידי אנשים שבוחרים לתת, להשתתף וליצור שינוי משמעותי.",
  "Be part of the movement": "היו חלק מהתנועה",
  "Clear Impact": "השפעה ברורה",
  "Secure Contribution": "תרומה מאובטחת",
  "Global Reach": "פריסה עולמית",
  "Professional Time, Gifted": "זמן מקצועי, במתנה",
  "Need immediate emergency support?": "זקוקים לתמיכת חירום מיידית?",
  "Find local crisis services.": "מצאו שירותי חירום מקומיים.",

  // --- Donate giving box (components/donate/DonateForm.tsx) ---
  "Confirm your gift": "אשרו את התרומה שלכם",
  Monthly: "חודשית",
  "One-time": "חד פעמית",
  "Please choose or enter a gift amount.": "בחרו או הזינו סכום תרומה.",
  "Something went wrong starting your donation. Please try again.": "משהו השתבש בהתחלת התרומה. נסו שוב.",
  "Redirecting to checkout…": "מפנה אתכם לתשלום…",
  "Continue to payment": "המשך לתשלום",
  "Message (optional)": "הודעה (לא חובה)",

  // --- Donate thank-you page (app/donate/thank-you/thankYouContent.ts) ---
  "Thank you for your gift": "תודה על התרומה שלכם",
  "Your payment has been confirmed. A receipt and confirmation email are on their way — your generosity helps gifted professional support reach more people, across borders.":
    "התשלום שלכם אושר. קבלה ואימייל אישור בדרך אליכם — הנדיבות שלכם עוזרת לתמיכה מקצועית מתנדבת להגיע ליותר אנשים, מעבר לגבולות.",
  "Your payment didn't go through": "התשלום שלכם לא הושלם",
  "No charge was made. If this wasn't intentional, you're welcome to try again — or reach out and we'll help directly.":
    "לא בוצע חיוב. אם זה לא היה מכוון, אתם מוזמנים לנסות שוב — או לפנות אלינו ואנחנו נעזור ישירות.",
  "Finishing up your gift": "משלימים את התרומה שלכם",
  "We're confirming your payment with our payment provider — this only takes a moment. You'll receive a confirmation email as soon as it clears.":
    "אנחנו מאשרים את התשלום שלכם מול ספק הסליקה — זה ייקח רק רגע. תקבלו אימייל אישור ברגע שהתשלום יאושר.",
  "Back to GESA": "חזרה ל-GESA",

  // --- Crisis Button (components/CrisisButton.tsx CRISIS_BUTTON_CONTENT_FALLBACK) ---
  "In crisis? Get help": "במשבר? קבלו עזרה",
  "You are not alone": "אתם לא לבד",
  "If you are struggling right now, help is available. Reach out to one of these resources.":
    "אם אתם מתקשים כרגע, יש עזרה זמינה. פנו לאחד מהמשאבים הבאים.",
  "988 Suicide & Crisis Lifeline": "הקו החם למניעת התאבדויות ומשברים 988",
  "24/7 free & confidential": "חינם וחסוי, 24/7",
  "Crisis Text Line": "קו הודעות טקסט למשבר",
  "Text HOME to 741741": "שלחו HOME למספר 741741",
  "988 Lifeline Chat": "צ'אט הקו החם 988",
  "Chat online now": "התחילו צ'אט עכשיו",
  "Find a helpline worldwide": "מצאו קו סיוע ברחבי העולם",
  "International directory": "מדריך בינלאומי",
  "GESA is not an emergency service. If you are in immediate danger, call your local emergency number.":
    "GESA אינה שירות חירום. אם אתם בסכנה מיידית, התקשרו למספר החירום המקומי שלכם.",

  // --- Volunteer application modal (components/volunteer/VolunteerApplicationModal.tsx) ---
  // "Become a volunteer therapist" already has an entry above (About
  // sections) with the identical English source string and Hebrew value —
  // reused there, not duplicated here.
  "Tell us about yourself — our team reviews every application before you're listed on the site.":
    "ספרו לנו על עצמכם — הצוות שלנו בודק כל בקשה לפני שהיא מפורסמת באתר.",
  "Submit application": "שליחת הבקשה",
  "Submitting…": "שולח…",
  "Full name": "שם מלא",
  Phone: "טלפון",
  "Phone (optional)": "טלפון (לא חובה)",
  "Proof of license / verification": "הוכחת רישיון / אימות",
  "Your license number, certifying body/institution, and any other credential details our team can verify.":
    "מספר הרישיון שלכם, הגוף/המוסד המסמיך, וכל פרט הסמכה נוסף שהצוות שלנו יכול לאמת.",
  "Our team reviews this before you're listed as a verified volunteer.":
    "הצוות שלנו בודק זאת לפני שאתם מפורסמים כמתנדבים מאושרים.",
  Specialties: "תחומי התמחות",
  "Other specialty…": "התמחות אחרת…",
  "Pick any that apply, or add your own — at least one is required.":
    "בחרו כל מה שרלוונטי, או הוסיפו משלכם — נדרש לפחות אחד.",
  Languages: "שפות",
  "Other language…": "שפה אחרת…",
  "Add every language you can work in — no limit, and not restricted to the list above.":
    "הוסיפו כל שפה שבה תוכלו לעבוד — ללא הגבלה, ולא רק מהרשימה למעלה.",
  // "Meeting duration" already has an entry above (Our Therapists page
  // filters) with the identical English source string and Hebrew value.
  "60 min": "60 דקות",
  "45 min": "45 דקות",
  "30 min": "30 דקות",
  "Specify time": "ציינו זמן",
  "How long a session are you able to commit to volunteering. Pick a preset, or Specify time to enter your own — this is shown on your public profile once you're listed.":
    "כמה זמן תוכלו להתחייב לפגישת התנדבות. בחרו אפשרות קיימת, או ציינו זמן להזנת משך משלכם — זה יוצג בפרופיל הציבורי שלכם ברגע שתפורסמו.",
  Bio: "ביוגרפיה",
  "Tell us about your background and why you'd like to volunteer with GESA.":
    "ספרו לנו על הרקע שלכם ומדוע תרצו להתנדב עם GESA.",
  "Please select or add at least one specialty.": "בחרו או הוסיפו לפחות תחום התמחות אחד.",
  "Please select or add at least one language.": "בחרו או הוסיפו לפחות שפה אחת.",
  "Please select a meeting duration.": "בחרו משך פגישה.",
  "Please specify how long you'd like your sessions to be.": "ציינו כמה זמן תרצו שהפגישות שלכם יימשכו.",
  "Something went wrong submitting your application. Please try again.": "משהו השתבש בשליחת הבקשה. נסו שוב.",

  // --- Shared UI chrome (components/ui/Modal.tsx close button aria-label) ---
  Close: "סגירה",
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
