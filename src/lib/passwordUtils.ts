/**
 * Password generation utility for agency-managed accounts
 */

/**
 * Generate a secure random password
 * @param length - Password length (default 12)
 * @returns Generated password string
 */
export function generatePassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Ensure at least one of each type
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  let password = '';
  
  // First 4 chars ensure variety
  password += lowercase[randomValues[0] % lowercase.length];
  password += uppercase[randomValues[1] % uppercase.length];
  password += numbers[randomValues[2] % numbers.length];
  password += symbols[randomValues[3] % symbols.length];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[randomValues[i] % allChars.length];
  }
  
  // Shuffle the password
  const shuffled = password.split('');
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint8Array(1))[0] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.join('');
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
