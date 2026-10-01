export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;
export const UPPERCASE_REGEX = /[A-Z]/;

export function validateName(name) {
  if (!name || typeof name !== 'string') return 'Name is required.';
  const len = name.trim().length;
  if (len < 20) return `Name must be at least 20 characters (currently ${len}).`;
  if (len > 60) return `Name must not exceed 60 characters (currently ${len}).`;
  return null;
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required.';
  if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address.';
  return null;
}

export function validateAddress(address) {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    return 'Address is required.';
  }
  if (address.trim().length > 400) {
    return `Address must not exceed 400 characters (currently ${address.trim().length}).`;
  }
  return null;
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required.';
  if (password.length < 8 || password.length > 16) {
    return `Password must be 8-16 characters (currently ${password.length}).`;
  }
  if (!UPPERCASE_REGEX.test(password)) {
    return 'Password must include at least one uppercase letter (A-Z).';
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return 'Password must include at least one special character (!@#$%^&* etc.).';
  }
  return null;
}

export function checkPasswordCriteria(password = '') {
  return {
    length: password.length >= 8 && password.length <= 16,
    uppercase: UPPERCASE_REGEX.test(password),
    specialChar: SPECIAL_CHAR_REGEX.test(password)
  };
}
