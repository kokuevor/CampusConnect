// Phone number validation and verification utilities for Ghana

// Ghana phone number validation
export function validateGhanaPhoneNumber(phoneNumber: string): boolean {
  // Remove any spaces, dashes, or other separators
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

  // Check if it starts with +233 and has exactly 13 digits
  if (cleanNumber.startsWith("+233") && cleanNumber.length === 13) {
    return true;
  }

  // Check if it starts with 233 and has exactly 12 digits
  if (cleanNumber.startsWith("233") && cleanNumber.length === 12) {
    return true;
  }

  // Check if it starts with 0 and has exactly 10 digits (local format)
  if (cleanNumber.startsWith("0") && cleanNumber.length === 10) {
    return true;
  }

  return false;
}

// Format phone number to international format
export function formatGhanaPhoneNumber(phoneNumber: string): string {
  const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

  // If it starts with 0, replace with +233
  if (cleanNumber.startsWith("0")) {
    return "+233" + cleanNumber.substring(1);
  }

  // If it starts with 233, add +
  if (cleanNumber.startsWith("233")) {
    return "+" + cleanNumber;
  }

  // If it already starts with +233, return as is
  if (cleanNumber.startsWith("+233")) {
    return cleanNumber;
  }

  // If it's a 9-digit number (without country code), add +233
  if (cleanNumber.length === 9) {
    return "+233" + cleanNumber;
  }

  return cleanNumber;
}

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Check if verification code is expired (15 minutes)
export function isVerificationCodeExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

// Get expiration time (15 minutes from now)
export function getVerificationExpiration(): Date {
  return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
}
