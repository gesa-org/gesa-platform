// Crisis-resources data layer for CrisisButton.tsx's country selector
// (see MAINTAINING_CRISIS_RESOURCES.md for how to add/update/verify an
// entry). This is intentionally NOT a hand-invented global database — every
// record below was checked against a real, named, official or recognized
// source at VERIFIED_DATE and carries that source forward so it can be
// re-checked later. A country with no entries here is a country we could
// not verify with confidence; CrisisResourceList.tsx shows the safe
// "we couldn't verify a local crisis line for this location" fallback for
// those rather than ever guessing a number.
//
// Never add a record here without a real sourceUrl you actually checked —
// this list is shown to people in active crisis; a wrong number is a real
// harm, not a cosmetic bug.

export type CrisisResourceType =
  | "emergency"
  | "suicide_crisis"
  | "mental_health_helpline"
  | "text_line"
  | "chat"
  | "youth_support";

export type CrisisResource = {
  /** ISO 3166-1 alpha-2, uppercase (e.g. "US"). */
  countryCode: string;
  countryName: string;
  serviceName: string;
  serviceType: CrisisResourceType;
  /** Display phone number, human-formatted (e.g. "116 123"). Null if this resource has no phone option. */
  phone: string | null;
  /** SMS keyword to text, if this is a keyword+shortcode text line (e.g. "HOME"). Null otherwise. */
  smsKeyword: string | null;
  /** SMS/short-code destination (e.g. "741741"). Null if not an SMS service. */
  smsNumber: string | null;
  /** Official web URL (chat, info page, or the org's site) if applicable. */
  url: string | null;
  availability: string;
  languages: string[] | null;
  /** Real source page this fact was checked against. */
  sourceUrl: string;
  /** ISO date this record was last checked against sourceUrl. */
  verifiedDate: string;
  /** Optional freeform caveat surfaced in the UI, e.g. uncertain hours. */
  note?: string;
};

const VERIFIED_DATE = "2026-09-09";

export const CRISIS_RESOURCES: CrisisResource[] = [
  // United States
  { countryCode: "US", countryName: "United States", serviceName: "911 Emergency (Police / Fire / Ambulance)", serviceType: "emergency", phone: "911", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["English"], sourceUrl: "https://www.fcc.gov/988-suicide-and-crisis-lifeline", verifiedDate: VERIFIED_DATE },
  { countryCode: "US", countryName: "United States", serviceName: "988 Suicide & Crisis Lifeline", serviceType: "suicide_crisis", phone: "988", smsKeyword: null, smsNumber: "988", url: "https://988lifeline.org/", availability: "24/7", languages: ["English", "Spanish"], sourceUrl: "https://988lifeline.org/faq/", verifiedDate: VERIFIED_DATE },
  { countryCode: "US", countryName: "United States", serviceName: "Crisis Text Line", serviceType: "text_line", phone: null, smsKeyword: "HOME", smsNumber: "741741", url: "https://www.crisistextline.org/", availability: "24/7", languages: ["English", "Spanish"], sourceUrl: "https://www.crisistextline.org/text-us/", verifiedDate: VERIFIED_DATE },
  { countryCode: "US", countryName: "United States", serviceName: "988 Lifeline Chat", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://988lifeline.org/chat", availability: "24/7", languages: ["English", "Spanish"], sourceUrl: "https://988lifeline.org/faq/", verifiedDate: VERIFIED_DATE },

  // Canada
  { countryCode: "CA", countryName: "Canada", serviceName: "911 Emergency (Police / Fire / Ambulance)", serviceType: "emergency", phone: "911", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["English", "French"], sourceUrl: "https://travel.gc.ca/assistance/emergency-assistance", verifiedDate: VERIFIED_DATE },
  { countryCode: "CA", countryName: "Canada", serviceName: "9-8-8: Suicide Crisis Helpline", serviceType: "suicide_crisis", phone: "988", smsKeyword: null, smsNumber: "988", url: "https://988.ca/", availability: "24/7", languages: ["English", "French"], sourceUrl: "https://988.ca/get-help/what-to-expect", verifiedDate: VERIFIED_DATE },
  { countryCode: "CA", countryName: "Canada", serviceName: "9-8-8 Text Support", serviceType: "text_line", phone: null, smsKeyword: null, smsNumber: "988", url: "https://988.ca/", availability: "24/7", languages: ["English", "French"], sourceUrl: "https://988.ca/get-help/what-to-expect", verifiedDate: VERIFIED_DATE },

  // United Kingdom
  { countryCode: "GB", countryName: "United Kingdom", serviceName: "999 Emergency (Police / Fire / Ambulance / Coastguard)", serviceType: "emergency", phone: "999", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["English"], sourceUrl: "https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/behaviours/help-for-suicidal-thoughts/", verifiedDate: VERIFIED_DATE },
  { countryCode: "GB", countryName: "United Kingdom", serviceName: "Samaritans", serviceType: "suicide_crisis", phone: "116 123", smsKeyword: null, smsNumber: null, url: "https://www.samaritans.org/", availability: "24/7", languages: ["English"], sourceUrl: "https://www.samaritans.org/how-we-can-help/contact-samaritan/talk-us-phone/", verifiedDate: VERIFIED_DATE },
  { countryCode: "GB", countryName: "United Kingdom", serviceName: "Shout 85258", serviceType: "text_line", phone: null, smsKeyword: "SHOUT", smsNumber: "85258", url: "https://giveusashout.org/", availability: "24/7", languages: ["English"], sourceUrl: "https://giveusashout.org/get-help/", verifiedDate: VERIFIED_DATE },

  // Ireland
  { countryCode: "IE", countryName: "Ireland", serviceName: "112 / 999 Emergency (Police / Fire / Ambulance)", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: "https://112.ie/", availability: "24/7", languages: ["English", "Irish"], sourceUrl: "https://www.gov.ie/en/department-of-the-taoiseach/services/how-to-contact-emergency-services-in-ireland/", verifiedDate: VERIFIED_DATE },
  { countryCode: "IE", countryName: "Ireland", serviceName: "Samaritans Ireland", serviceType: "suicide_crisis", phone: "116 123", smsKeyword: null, smsNumber: null, url: "https://www.samaritans.org/samaritans-ireland/", availability: "24/7", languages: ["English"], sourceUrl: "https://www.samaritans.org/samaritans-ireland/about/governance-and-structure/contact-us/", verifiedDate: VERIFIED_DATE },
  { countryCode: "IE", countryName: "Ireland", serviceName: "Pieta House 24 Hour Crisis Helpline", serviceType: "suicide_crisis", phone: "1800 247 247", smsKeyword: "HELP", smsNumber: "51444", url: "https://www.pieta.ie/how-we-can-help/helpline/", availability: "24/7", languages: ["English"], sourceUrl: "https://www.pieta.ie/how-we-can-help/helpline/", verifiedDate: VERIFIED_DATE },
  { countryCode: "IE", countryName: "Ireland", serviceName: "Text About It", serviceType: "text_line", phone: null, smsKeyword: "HELLO", smsNumber: "50808", url: "https://text50808.ie/", availability: "24/7", languages: ["English"], sourceUrl: "https://text50808.ie/", verifiedDate: VERIFIED_DATE },

  // Australia
  { countryCode: "AU", countryName: "Australia", serviceName: "Triple Zero (Police / Fire / Ambulance)", serviceType: "emergency", phone: "000", smsKeyword: null, smsNumber: null, url: "https://www.triplezero.gov.au/", availability: "24/7", languages: ["English", "Interpreter services available"], sourceUrl: "https://www.infrastructure.gov.au/emergency-calls", verifiedDate: VERIFIED_DATE },
  { countryCode: "AU", countryName: "Australia", serviceName: "Lifeline Australia", serviceType: "suicide_crisis", phone: "13 11 14", smsKeyword: null, smsNumber: null, url: "https://www.lifeline.org.au/get-help/services/131114", availability: "24/7", languages: ["English", "Interpreter services available"], sourceUrl: "https://www.lifeline.org.au/131114", verifiedDate: VERIFIED_DATE },
  { countryCode: "AU", countryName: "Australia", serviceName: "Lifeline Crisis Text Service", serviceType: "text_line", phone: null, smsKeyword: null, smsNumber: "0477 13 11 14", url: "https://www.lifeline.org.au/text", availability: "24/7", languages: ["English"], sourceUrl: "https://www.lifeline.org.au/text", verifiedDate: VERIFIED_DATE },
  { countryCode: "AU", countryName: "Australia", serviceName: "Lifeline Crisis Chat", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://www.lifeline.org.au/get-help/services/chat", availability: "24/7", languages: ["English"], sourceUrl: "https://www.lifeline.org.au/text", verifiedDate: VERIFIED_DATE },

  // New Zealand
  { countryCode: "NZ", countryName: "New Zealand", serviceName: "111 Emergency (Police / Fire / Ambulance)", serviceType: "emergency", phone: "111", smsKeyword: null, smsNumber: null, url: "https://www.police.govt.nz/call-111", availability: "24/7", languages: ["English", "Te Reo Māori", "Interpreter services available"], sourceUrl: "https://www.police.govt.nz/call-111", verifiedDate: VERIFIED_DATE },
  { countryCode: "NZ", countryName: "New Zealand", serviceName: "1737 Need to Talk", serviceType: "suicide_crisis", phone: "1737", smsKeyword: null, smsNumber: "1737", url: "https://www.1737.org.nz/", availability: "24/7", languages: ["English"], sourceUrl: "https://www.1737.org.nz/how-1737-works", verifiedDate: VERIFIED_DATE },

  // Japan
  { countryCode: "JP", countryName: "Japan", serviceName: "Police Emergency", serviceType: "emergency", phone: "110", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Japanese"], sourceUrl: "https://telljp.com/lifeline/", verifiedDate: VERIFIED_DATE },
  { countryCode: "JP", countryName: "Japan", serviceName: "Fire / Ambulance Emergency", serviceType: "emergency", phone: "119", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Japanese"], sourceUrl: "https://telljp.com/lifeline/", verifiedDate: VERIFIED_DATE },
  { countryCode: "JP", countryName: "Japan", serviceName: "Yorisoi Hotline (よりそいホットライン)", serviceType: "suicide_crisis", phone: "0120-279-338", smsKeyword: null, smsNumber: null, url: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/seikatsuhogo/jisatsu/soudan_info.html", availability: "24/7", languages: ["Japanese", "Foreign-language support available"], sourceUrl: "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/hukushi_kaigo/seikatsuhogo/jisatsu/soudan_info.html", verifiedDate: VERIFIED_DATE },
  { countryCode: "JP", countryName: "Japan", serviceName: "TELL Lifeline", serviceType: "suicide_crisis", phone: "0800-300-8355", smsKeyword: null, smsNumber: null, url: "https://telljp.com/lifeline/", availability: "Not confirmed 24/7 — hours vary weekly", languages: ["English"], sourceUrl: "https://telljp.com/lifeline/", verifiedDate: VERIFIED_DATE, note: "Check telljp.com/lifeline for this week's hours before relying on availability." },
  { countryCode: "JP", countryName: "Japan", serviceName: "TELL Chat", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://telljp.com/lifeline/", availability: "Daily from 16:00 (hours vary)", languages: ["English"], sourceUrl: "https://telljp.com/lifeline/", verifiedDate: VERIFIED_DATE },

  // Singapore
  { countryCode: "SG", countryName: "Singapore", serviceName: "Police Emergency", serviceType: "emergency", phone: "999", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["English", "Mandarin", "Malay", "Tamil"], sourceUrl: "https://www.gov.sg/contact-us/", verifiedDate: VERIFIED_DATE },
  { countryCode: "SG", countryName: "Singapore", serviceName: "SCDF Fire / Ambulance Emergency", serviceType: "emergency", phone: "995", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["English", "Mandarin", "Malay", "Tamil"], sourceUrl: "https://www.gov.sg/contact-us/", verifiedDate: VERIFIED_DATE },
  { countryCode: "SG", countryName: "Singapore", serviceName: "Samaritans of Singapore (SOS) Hotline", serviceType: "suicide_crisis", phone: "1767", smsKeyword: null, smsNumber: null, url: "https://www.sos.org.sg/", availability: "24/7", languages: ["English"], sourceUrl: "https://www.sos.org.sg/contact-us/", verifiedDate: VERIFIED_DATE },
  { countryCode: "SG", countryName: "Singapore", serviceName: "SOS CareText (WhatsApp)", serviceType: "text_line", phone: null, smsKeyword: null, smsNumber: "9151 1767", url: "https://wa.me/6591511767", availability: "24/7 (WhatsApp, not standard SMS)", languages: ["English"], sourceUrl: "https://www.sos.org.sg/contact-us/", verifiedDate: VERIFIED_DATE },

  // Philippines
  { countryCode: "PH", countryName: "Philippines", serviceName: "Unified 911 Emergency Hotline", serviceType: "emergency", phone: "911", smsKeyword: null, smsNumber: null, url: "https://e911.gov.ph/", availability: "24/7", languages: ["Filipino", "English"], sourceUrl: "https://pia.gov.ph/news/one-number-for-all-emergencies-unified-911-to-launch-nationwide/", verifiedDate: VERIFIED_DATE },
  { countryCode: "PH", countryName: "Philippines", serviceName: "NCMH Crisis Hotline", serviceType: "suicide_crisis", phone: "1553", smsKeyword: null, smsNumber: "0919 057 1553", url: "https://ncmh.gov.ph/", availability: "24/7", languages: ["Filipino", "English"], sourceUrl: "https://ncmh.gov.ph/contact-us/", verifiedDate: VERIFIED_DATE },

  // Germany
  { countryCode: "DE", countryName: "Germany", serviceName: "112 (EU Emergency) / 110 (Police)", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["German"], sourceUrl: "https://www.iamexpat.de/expat-info/emergency-numbers-services-germany/german-emergency-numbers-112-110", verifiedDate: VERIFIED_DATE },
  { countryCode: "DE", countryName: "Germany", serviceName: "TelefonSeelsorge", serviceType: "suicide_crisis", phone: "0800 111 0 111", smsKeyword: null, smsNumber: null, url: "https://www.telefonseelsorge.de/", availability: "24/7", languages: ["German"], sourceUrl: "https://www.telefonseelsorge.de/", verifiedDate: VERIFIED_DATE },
  { countryCode: "DE", countryName: "Germany", serviceName: "TelefonSeelsorge Online Chat / Mail Counseling", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://www.telefonseelsorge.de/chat/", availability: "Chat by appointment; email typically answered within 48h", languages: ["German"], sourceUrl: "https://www.telefonseelsorge.de/chat/", verifiedDate: VERIFIED_DATE },

  // France
  { countryCode: "FR", countryName: "France", serviceName: "112 (EU) / 15 (SAMU) / 17 (Police) / 18 (Pompiers)", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["French"], sourceUrl: "https://www.fftelecoms.org/actualites/numeros-urgence-a-connaitre-appel-112-15-17-18/", verifiedDate: VERIFIED_DATE },
  { countryCode: "FR", countryName: "France", serviceName: "3114 – Numéro national de prévention du suicide", serviceType: "suicide_crisis", phone: "3114", smsKeyword: null, smsNumber: null, url: "https://3114.fr/", availability: "24/7", languages: ["French"], sourceUrl: "https://3114.fr/", verifiedDate: VERIFIED_DATE },
  { countryCode: "FR", countryName: "France", serviceName: "3114 Chat en ligne", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://3114.fr/", availability: "Daily 09:00–22:00", languages: ["French"], sourceUrl: "https://3114.fr/", verifiedDate: VERIFIED_DATE },

  // Netherlands
  { countryCode: "NL", countryName: "Netherlands", serviceName: "112 Emergency", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Dutch", "English"], sourceUrl: "https://www.iamexpat.nl/expat-info/emergency-numbers-services-netherlands/dutch-police", verifiedDate: VERIFIED_DATE },
  { countryCode: "NL", countryName: "Netherlands", serviceName: "113 Zelfmoordpreventie", serviceType: "suicide_crisis", phone: "113", smsKeyword: null, smsNumber: null, url: "https://www.113.nl/", availability: "24/7", languages: ["Dutch"], sourceUrl: "https://www.113.nl/heb-je-nu-hulp-nodig/hulplijn", verifiedDate: VERIFIED_DATE },
  { countryCode: "NL", countryName: "Netherlands", serviceName: "113 Online Chat", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://www.113.nl/chatten", availability: "24/7", languages: ["Dutch"], sourceUrl: "https://www.113.nl/heb-je-nu-hulp-nodig/hulplijn", verifiedDate: VERIFIED_DATE },

  // Spain
  { countryCode: "ES", countryName: "Spain", serviceName: "112 Emergencias", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Spanish", "English"], sourceUrl: "https://administracion.gob.es/pag_Home/Tu-espacio-europeo/derechos-obligaciones/ciudadanos/asistencia-sanitaria/numeros-urgencia.html", verifiedDate: VERIFIED_DATE },
  { countryCode: "ES", countryName: "Spain", serviceName: "024 – Línea de atención a la conducta suicida", serviceType: "suicide_crisis", phone: "024", smsKeyword: null, smsNumber: null, url: "https://www.sanidad.gob.es/linea024/home.htm", availability: "24/7", languages: ["Spanish", "Catalan", "Basque", "Galician"], sourceUrl: "https://www.sanidad.gob.es/linea024/home.htm", verifiedDate: VERIFIED_DATE },
  { countryCode: "ES", countryName: "Spain", serviceName: "024 Chat on-line (Cruz Roja)", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://www2.cruzroja.es/web/cruzroja/chat-linea024", availability: "24/7", languages: ["Spanish"], sourceUrl: "https://www.sanidad.gob.es/linea024/home.htm", verifiedDate: VERIFIED_DATE },

  // Italy
  { countryCode: "IT", countryName: "Italy", serviceName: "112 Numero Unico Emergenza", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Italian"], sourceUrl: "https://www.vigilfuoco.it/emergenza-112", verifiedDate: VERIFIED_DATE },
  { countryCode: "IT", countryName: "Italy", serviceName: "Telefono Amico Italia", serviceType: "suicide_crisis", phone: "02 2327 2327", smsKeyword: null, smsNumber: null, url: "https://www.telefonoamico.it/", availability: "Hours vary — could not confirm 24/7 directly on the org's own site", languages: ["Italian"], sourceUrl: "https://www.telefonoamico.it/contatti/", verifiedDate: VERIFIED_DATE, note: "A 24/7 claim is reported by secondary press only; confirm current hours on telefonoamico.it before relying on it." },

  // Sweden
  { countryCode: "SE", countryName: "Sweden", serviceName: "112 (SOS Alarm)", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: "https://www.sosalarm.se/", availability: "24/7", languages: ["Swedish", "English"], sourceUrl: "https://www.sosalarm.se/en/112-and-other-important-numbers/important-phone-numbers/112--swedens-emergency-number-for-urgent-assistance/", verifiedDate: VERIFIED_DATE },
  { countryCode: "SE", countryName: "Sweden", serviceName: "Självmordslinjen (Mind)", serviceType: "suicide_crisis", phone: "90101", smsKeyword: null, smsNumber: null, url: "https://mind.se/stod-kunskap/prata-eller-chatta-med-volontar/sjalvmordslinjen/", availability: "24/7 (wait times vary)", languages: ["Swedish"], sourceUrl: "https://mind.se/stod-kunskap/prata-eller-chatta-med-volontar/sjalvmordslinjen/", verifiedDate: VERIFIED_DATE },
  { countryCode: "SE", countryName: "Sweden", serviceName: "Självmordslinjen Chat", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://mind.se/stod-kunskap/prata-eller-chatta-med-volontar/sjalvmordslinjen/chatt/", availability: "24/7", languages: ["Swedish"], sourceUrl: "https://mind.se/stod-kunskap/prata-eller-chatta-med-volontar/sjalvmordslinjen/", verifiedDate: VERIFIED_DATE },

  // Norway
  { countryCode: "NO", countryName: "Norway", serviceName: "112 Emergency", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Norwegian", "English"], sourceUrl: "https://en.wikipedia.org/wiki/112_(emergency_telephone_number)", verifiedDate: VERIFIED_DATE },
  { countryCode: "NO", countryName: "Norway", serviceName: "Hjelpetelefonen (Mental Helse)", serviceType: "suicide_crisis", phone: "116 123", smsKeyword: null, smsNumber: null, url: "https://mentalhelse.no/fa-hjelp/hjelpetelefonen/", availability: "24/7", languages: ["Norwegian"], sourceUrl: "https://mentalhelse.no/fa-hjelp/hjelpetelefonen/", verifiedDate: VERIFIED_DATE },

  // Denmark
  { countryCode: "DK", countryName: "Denmark", serviceName: "112 (Danish Police / Emergency)", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: "https://politi.dk/en/about-the-police/contact-the-police/emergency-112", availability: "24/7", languages: ["Danish", "English"], sourceUrl: "https://politi.dk/en/about-the-police/contact-the-police/emergency-112", verifiedDate: VERIFIED_DATE },
  { countryCode: "DK", countryName: "Denmark", serviceName: "Livslinien", serviceType: "suicide_crisis", phone: "70 20 12 01", smsKeyword: null, smsNumber: null, url: "https://www.livslinien.dk/raadgivning", availability: "Daily 09:00–05:00 (per the official site — not full 24/7)", languages: ["Danish"], sourceUrl: "https://www.livslinien.dk/raadgivning", verifiedDate: VERIFIED_DATE },
  { countryCode: "DK", countryName: "Denmark", serviceName: "Livslinien Chatrådgivning", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://www.livslinien.dk/raadgivning/chatraadgivning/start-chat", availability: "Mon–Fri 17:00–21:00; Sat–Sun 13:00–17:00", languages: ["Danish"], sourceUrl: "https://www.livslinien.dk/raadgivning", verifiedDate: VERIFIED_DATE },

  // Finland
  { countryCode: "FI", countryName: "Finland", serviceName: "112 Emergency Response Centre", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: "https://112.fi/en/erc-number", availability: "24/7", languages: ["Finnish", "Swedish", "English"], sourceUrl: "https://112.fi/en/erc-number", verifiedDate: VERIFIED_DATE },
  { countryCode: "FI", countryName: "Finland", serviceName: "MIELI Kriisipuhelin (Crisis Helpline)", serviceType: "suicide_crisis", phone: "09 2525 0111", smsKeyword: null, smsNumber: null, url: "https://mieli.fi/en/support-and-help/crisis-helpline/", availability: "24/7", languages: ["Finnish"], sourceUrl: "https://mieli.fi/en/support-and-help/crisis-helpline/", verifiedDate: VERIFIED_DATE },
  { countryCode: "FI", countryName: "Finland", serviceName: "MIELI Kriisichat", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://mieli.fi/en/support-and-help/chat-or-write/", availability: "Mon–Thu 15:00–21:00", languages: ["Finnish"], sourceUrl: "https://mieli.fi/en/support-and-help/chat-or-write/", verifiedDate: VERIFIED_DATE },

  // Poland
  { countryCode: "PL", countryName: "Poland", serviceName: "112 General Emergency", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Polish", "English"], sourceUrl: "https://www.112emergency.eu/poland", verifiedDate: VERIFIED_DATE },
  { countryCode: "PL", countryName: "Poland", serviceName: "Centrum Wsparcia dla Osób Dorosłych w Kryzysie Psychicznym", serviceType: "suicide_crisis", phone: "800 702 222", smsKeyword: null, smsNumber: null, url: "https://centrumwsparcia.pl/", availability: "24/7, free of charge", languages: ["Polish"], sourceUrl: "https://centrumwsparcia.pl/", verifiedDate: VERIFIED_DATE },
  { countryCode: "PL", countryName: "Poland", serviceName: "Centrum Wsparcia Chat", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://centrumwsparcia.pl/", availability: "24/7", languages: ["Polish"], sourceUrl: "https://centrumwsparcia.pl/", verifiedDate: VERIFIED_DATE },

  // India
  { countryCode: "IN", countryName: "India", serviceName: "Emergency Response Support System (ERSS)", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: "https://112.gov.in/", availability: "24/7", languages: null, sourceUrl: "https://112.gov.in/", verifiedDate: VERIFIED_DATE },
  { countryCode: "IN", countryName: "India", serviceName: "Tele MANAS (National Tele Mental Health Programme)", serviceType: "suicide_crisis", phone: "14416", smsKeyword: null, smsNumber: null, url: "https://telemanas.mohfw.gov.in/", availability: "24/7", languages: ["English", "Hindi", "Regional languages"], sourceUrl: "https://telemanas.mohfw.gov.in/home", verifiedDate: VERIFIED_DATE, note: "Also reachable toll-free at 1-800-891-4416." },
  { countryCode: "IN", countryName: "India", serviceName: "Vandrevala Foundation Helpline", serviceType: "mental_health_helpline", phone: "+91 9999 666 555", smsKeyword: null, smsNumber: null, url: "https://www.vandrevalafoundation.com/free-counseling", availability: "24/7", languages: null, sourceUrl: "https://www.vandrevalafoundation.com/free-counseling/contact-us", verifiedDate: VERIFIED_DATE },

  // South Africa
  { countryCode: "ZA", countryName: "South Africa", serviceName: "South African Police Service Emergency", serviceType: "emergency", phone: "10111", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: null, sourceUrl: "https://www.gov.za/sites/default/files/gcis_documents/contacts.pdf", verifiedDate: VERIFIED_DATE },
  { countryCode: "ZA", countryName: "South Africa", serviceName: "Ambulance Emergency Services", serviceType: "emergency", phone: "10177", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: null, sourceUrl: "https://en.wikipedia.org/wiki/Emergency_medical_services_in_South_Africa", verifiedDate: VERIFIED_DATE },
  { countryCode: "ZA", countryName: "South Africa", serviceName: "General Emergency (mobile)", serviceType: "emergency", phone: "112", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: null, sourceUrl: "https://za.usembassy.gov/emergency-assistance/", verifiedDate: VERIFIED_DATE },
  { countryCode: "ZA", countryName: "South Africa", serviceName: "SADAG Suicide Crisis Helpline", serviceType: "suicide_crisis", phone: "0800 567 567", smsKeyword: null, smsNumber: null, url: "https://www.sadag.org/", availability: "24/7", languages: null, sourceUrl: "https://www.sadag.org/index.php?option=com_content&view=article&id=1904&Itemid=151", verifiedDate: VERIFIED_DATE },

  // Brazil
  { countryCode: "BR", countryName: "Brazil", serviceName: "Polícia Militar (Police)", serviceType: "emergency", phone: "190", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Portuguese"], sourceUrl: "https://allemergencynum.com/brazil/", verifiedDate: VERIFIED_DATE },
  { countryCode: "BR", countryName: "Brazil", serviceName: "SAMU (Ambulance)", serviceType: "emergency", phone: "192", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Portuguese"], sourceUrl: "https://allemergencynum.com/brazil/", verifiedDate: VERIFIED_DATE },
  { countryCode: "BR", countryName: "Brazil", serviceName: "CVV – Centro de Valorização da Vida", serviceType: "suicide_crisis", phone: "188", smsKeyword: null, smsNumber: null, url: "https://cvv.org.br/", availability: "24/7 (phone); chat hours vary", languages: ["Portuguese"], sourceUrl: "https://cvv.org.br/ligue-188/", verifiedDate: VERIFIED_DATE },
  { countryCode: "BR", countryName: "Brazil", serviceName: "CVV Online Chat", serviceType: "chat", phone: null, smsKeyword: null, smsNumber: null, url: "https://cvv.org.br/chat/", availability: "Varies by day — see cvv.org.br/chat", languages: ["Portuguese"], sourceUrl: "https://cvv.org.br/chat/", verifiedDate: VERIFIED_DATE },

  // Mexico
  { countryCode: "MX", countryName: "Mexico", serviceName: "Número de Emergencias 911", serviceType: "emergency", phone: "911", smsKeyword: null, smsNumber: null, url: null, availability: "24/7", languages: ["Spanish"], sourceUrl: "https://allemergencynum.com/mexico/universal/911/", verifiedDate: VERIFIED_DATE },
  { countryCode: "MX", countryName: "Mexico", serviceName: "Línea de la Vida", serviceType: "suicide_crisis", phone: "800 911 2000", smsKeyword: null, smsNumber: null, url: "https://www.gob.mx/lineadelavida", availability: "24/7", languages: ["Spanish"], sourceUrl: "https://www.gob.mx/conasama/articulos/linea-de-la-vida-800-911-2000", verifiedDate: VERIFIED_DATE },
  { countryCode: "MX", countryName: "Mexico", serviceName: "SAPTEL", serviceType: "mental_health_helpline", phone: "55 5259 8121", smsKeyword: null, smsNumber: null, url: "https://www.saptel.org.mx/", availability: "24/7", languages: ["Spanish"], sourceUrl: "https://www.saptel.org.mx/contacto.html", verifiedDate: VERIFIED_DATE },
];

/** Every ISO country code this dataset has at least one verified resource for. */
export const VERIFIED_COUNTRY_CODES: ReadonlySet<string> = new Set(CRISIS_RESOURCES.map((r) => r.countryCode));

const TYPE_ORDER: CrisisResourceType[] = ["emergency", "suicide_crisis", "mental_health_helpline", "text_line", "chat", "youth_support"];

/**
 * Returns this country's verified resources, emergency services first, then
 * crisis/suicide lines, then everything else — so the single most urgent
 * number is always the first card a person in crisis sees. Returns an empty
 * array (not undefined, not a guess) for a country with no verified data;
 * callers must render the safe fallback state in that case rather than
 * inventing a number.
 */
export function getResourcesForCountry(countryCode: string): CrisisResource[] {
  const code = countryCode.toUpperCase();
  return CRISIS_RESOURCES.filter((r) => r.countryCode === code).sort(
    (a, b) => TYPE_ORDER.indexOf(a.serviceType) - TYPE_ORDER.indexOf(b.serviceType)
  );
}

export function hasVerifiedResources(countryCode: string): boolean {
  return VERIFIED_COUNTRY_CODES.has(countryCode.toUpperCase());
}

/** tel: hrefs need a clean digit/plus string — this strips spaces, dashes, parens from a display number. */
export function toTelHref(phone: string): string {
  // A "14416" style short code and a "+91 9999 666 555" full number both
  // reduce correctly here; anything that isn't a digit or a leading + is
  // dropped rather than passed through, since it can only ever be
  // formatting punctuation in data we control (see CRISIS_RESOURCES above).
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}

/** sms: hrefs — body is the keyword when there is one (e.g. "sms:741741?body=HOME"). */
export function toSmsHref(smsNumber: string, smsKeyword: string | null): string {
  const cleaned = smsNumber.replace(/[^\d+]/g, "");
  return smsKeyword ? `sms:${cleaned}?body=${encodeURIComponent(smsKeyword)}` : `sms:${cleaned}`;
}
