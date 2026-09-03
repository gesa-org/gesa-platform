import { parsePhoneNumberFromString } from "libphonenumber-js";

const cases = [
  { in: "+639171234567", expectCountry: "PH" },
  { in: "+61412345678", expectCountry: "AU" },
  { in: "+447911123456", expectCountry: "GB" },
  { in: "+14155552671", expectCountry: "US" },
  { in: "09171234567", country: "PH", expectE164: "+639171234567" },
  { in: "917 123 4567", country: "PH", expectE164: "+639171234567" },
  { in: "not a number", country: "US", expectInvalid: true },
  { in: "12345", country: "US", expectInvalid: true },
];

for (const c of cases) {
  const parsed = c.country
    ? parsePhoneNumberFromString(c.in, c.country)
    : parsePhoneNumberFromString(c.in);
  const valid = parsed?.isValid() ?? false;
  console.log(
    JSON.stringify(c.in), c.country ? `(country hint ${c.country})` : "",
    "-> country:", parsed?.country, "valid:", valid, "e164:", parsed?.number,
    "national:", parsed?.formatNational()
  );
}
