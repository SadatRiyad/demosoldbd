export function whatsappOrderLink(phoneE164: string, message: string) {
  const base = "https://wa.me/";
  const phone = phoneE164.replace(/\+/g, "");
  return `${base}${phone}?text=${encodeURIComponent(message)}`;
}
