/**
 * Utility to generate sanitized WhatsApp Click-to-Chat deep links
 */
export function buildWhatsAppLink({ phone, message }) {
  if (!phone) return "";

  // Strip spaces, dashes, symbols
  let cleanPhone = String(phone).replace(/[^0-9]/g, "");

  // If 10-digit Indian phone number, prepend India country code 91
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const encodedText = encodeURIComponent(message || "");
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function formatDateTimeReadable(dateStr) {
  if (!dateStr) return "as scheduled";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (_e) {
    return dateStr;
  }
}
