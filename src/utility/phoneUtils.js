export const countryCodes = [
  {
    code: "+91",
    country: "India",
    flag: "🇮🇳",
    pattern: /^(\d{5})(\d{5})$/,
    format: "$1-$2",
  },
  {
    code: "+1",
    country: "US/Canada",
    flag: "🇺🇸",
    pattern: /^(\d{3})(\d{3})(\d{4})$/,
    format: "($1) $2-$3",
  },
  {
    code: "+44",
    country: "UK",
    flag: "🇬🇧",
    pattern: /^(\d{4})(\d{6})$/,
    format: "$1 $2",
  },
  {
    code: "+61",
    country: "Australia",
    flag: "🇦🇺",
    pattern: /^(\d{4})(\d{3})(\d{3})$/,
    format: "$1 $2 $3",
  },
  {
    code: "+971",
    country: "UAE",
    flag: "🇦🇪",
    pattern: /^(\d{2})(\d{3})(\d{4})$/,
    format: "$1 $2 $3",
  },
  {
    code: "+65",
    country: "Singapore",
    flag: "🇸🇬",
    pattern: /^(\d{4})(\d{4})$/,
    format: "$1 $2",
  },
];

export const formatPhoneNumber = (value, countryCode) => {
  if (!value) return "";
  const country = countryCodes.find((c) => c.code === countryCode);
  if (!country) return value;
  const digits = value.replace(/\D/g, "");
  if (country.pattern) {
    const match = digits.match(country.pattern);
    if (match) {
      return country.format.replace(/\$(\d+)/g, (_, index) => match[index]);
    }
  }
  return digits;
};