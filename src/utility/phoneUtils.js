export const countryCodes = [
  {
    code: "+91",
    country: "India",
    flag: "🇮🇳",
    pattern: /^(\d{5})(\d{5})$/,
    format: "$1-$2",
  },
];

export const formatPhoneNumber = (value, countryCode) => {
  if (!value) return "";
  const country = countryCodes.find((c) => c.code === countryCode);
  if (!country) return value;
  const digits = value.replace(/\D/g, "");
  return digits.replace(country.pattern, country.format);
};

  if (country.pattern) {
    const match = digits.match(country.pattern);
    if (match) {
      return country.format.replace(/\$(\d+)/g, (_, index) => match[index]);
    }
  }
  return digits;
}