import { parsePhoneNumberFromString } from "libphonenumber-js";

const COUNTRY_ISO = {
  Mexico: "MX",
  Israel: "IL",
  USA: "US",
  "USA North Carolina": "US",
  UK: "GB",
  Argentina: "AR",
  Brazil: "BR",
  "New Zealand": "NZ",
  Spain: "ES",
  Bulgaria: "BG",
  Germany: "DE",
  Australia: "AU",
  Portugal: "PT",
};

const rows = [
  ["Bertrand Finckler", "525506550", "Israel"],
  ["Dana Ahituv Gez", "972506765", "Israel"],
  ["Einat Lev Haim", "447826668", "UK"],
  ["Ester Laniado", "14242889750", "Argentina"],
  ["Guilherme Kristensen", "5511 94457-8880", "Brazil"],
  ["Hemed Meidan", "972549987771", "Israel"],
  ["Iris Levkovitz", "170472469", "USA North Carolina"],
  ["Jan Michelle Mittleman", "2039120984", "USA"],
  ["Karin Horen", "64210 260 4470", "New Zealand"],
  ["Leah Rosenblatt", "972505307", "Israel"],
  ["Linda Kedy", "34634 14 71 56", "Spain"],
  ["Meirav Lev-Ari", "1(917) 939-3990", "USA"],
  ["Meital Moscovich", "887740014", "Bulgaria"],
  ["Michael Miller", "1(303) 514-3398", "USA"],
  ["Michal Tsror", "97254-233-7151", "Israel"],
  ["Moshe Gerstel", "17681088088", "Germany"],
  ["Myrna Lewinsohn", "5255 5438 7880", "Mexico"],
  ["Patricia Villavicencio Carrillo", "97250666282359", "Spain"],
  ["Phenix Pan", "97258774364", "Portugal"],
  ["Sarah Bechor Backenroth", "972542471471", "Israel"],
  ["Susan Bloch", "2067791074", "USA"],
  ["Tal Zohar", "97254980996", "Israel"],
  ["Tayo Oseni-Alexis Oseni-Alexis", "447732 232536", "UK"],
  ["Yossi Unterman", "+972505680898", "Israel"],
];

for (const [name, raw, country] of rows) {
  const iso = COUNTRY_ISO[country];
  const cleaned = String(raw).trim();
  let result = null;
  // Try with country hint first
  let pn = parsePhoneNumberFromString(cleaned, iso);
  if (pn && pn.isValid()) {
    result = pn.number;
  } else {
    // try treating as already-international if it starts with the country's dial code digits
    pn = parsePhoneNumberFromString("+" + cleaned.replace(/[^\d]/g, ""));
    if (pn && pn.isValid()) result = pn.number;
  }
  console.log(JSON.stringify({ name, raw, country, iso, e164: result, valid: !!result }));
}
