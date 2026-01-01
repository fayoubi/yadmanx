/**
 * Utility functions for formatting data
 */

/**
 * Mask CIN (Carte d'Identité Nationale) for display
 * Shows first 2 characters and last 3 characters, masks the rest
 * Example: BK2134566 -> BK****566
 *
 * @param {string} cin - The CIN to mask
 * @returns {string} Masked CIN or '****' if unable to parse
 */
export function maskCIN(cin) {
  // Return default mask if CIN is null, undefined, or empty
  if (!cin || typeof cin !== 'string' || cin.trim() === '') {
    return '****';
  }

  const trimmedCIN = cin.trim();

  // If CIN is shorter than 5 characters, return default mask
  if (trimmedCIN.length < 5) {
    return '****';
  }

  // Extract first 2 and last 3 characters
  const firstTwo = trimmedCIN.substring(0, 2);
  const lastThree = trimmedCIN.substring(trimmedCIN.length - 3);

  // Always use 4 asterisks in the middle
  return `${firstTwo}****${lastThree}`;
}

/**
 * Format phone number for display
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as +XXX XX XX XX XX if it's a Moroccan number (starts with 212)
  if (cleaned.startsWith('212') && cleaned.length === 12) {
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9)}`;
  }

  // Format as XX XX XX XX XX for 10-digit numbers
  if (cleaned.length === 10) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 4)} ${cleaned.substring(4, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8)}`;
  }

  // Return original if not matching expected format
  return phone;
}

/**
 * Format full name from first and last name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Full name or 'Unnamed Customer' if both are missing
 */
export function formatFullName(firstName, lastName) {
  const first = firstName?.trim() || '';
  const last = lastName?.trim() || '';

  if (!first && !last) {
    return 'Unnamed Customer';
  }

  return `${first} ${last}`.trim();
}
