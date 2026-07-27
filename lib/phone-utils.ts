/**
 * Normalizes a phone number for WhatsApp links
 * Handles various formats: 11..., 549..., +5411..., +549..., 15..., etc.
 * Always returns format: 549XXXXXXXXXX (without +)
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If empty after cleaning, return empty
  if (!cleaned) return '';
  
  // Handle different cases:
  
  // If starts with 549 and has proper length (13 digits), it's already correct
  if (cleaned.startsWith('549') && cleaned.length === 13) {
    return cleaned;
  }
  
  // If starts with 54 but not 549 (like 5411...), insert 9 after 54
  if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    cleaned = '549' + cleaned.slice(2);
    return cleaned;
  }
  
  // If starts with 549 but wrong length, return as is
  if (cleaned.startsWith('549')) {
    return cleaned;
  }
  
  // If starts with 15 (old mobile prefix), replace with 549 + area code
  // Assuming Buenos Aires area (11)
  if (cleaned.startsWith('15') && cleaned.length === 10) {
    return '5491' + cleaned.slice(2);
  }
  
  // If starts with 11 (Buenos Aires area code without country)
  if (cleaned.startsWith('11') && cleaned.length === 10) {
    return '549' + cleaned;
  }
  
  // If it's a 10-digit number starting with any area code
  if (cleaned.length === 10) {
    return '549' + cleaned;
  }
  
  // If it's an 8-digit number (local number without area code)
  // Assume Buenos Aires (11)
  if (cleaned.length === 8) {
    return '54911' + cleaned;
  }
  
  // Default: prepend 549 if doesn't start with it
  if (!cleaned.startsWith('549')) {
    return '549' + cleaned;
  }
  
  return cleaned;
}

/**
 * Creates a WhatsApp link with optional pre-filled message
 */
export function createWhatsAppLink(phone: string, message?: string): string {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  if (!normalizedPhone) return '#';
  
  let url = `https://wa.me/${normalizedPhone}`;
  if (message) {
    url += `?text=${encodeURIComponent(message)}`;
  }
  return url;
}
