/**
 * Validation rules specified in the requirements:
 * - Name: Min 20 characters, Max 60 characters.
 * - Address: Max 400 characters.
 * - Password: 8-16 characters, must include at least one uppercase letter and one special character.
 * - Email: Must follow standard email validation rules.
 * - Rating: 1 to 5.
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;
const UPPERCASE_REGEX = /[A-Z]/;

function validateName(name) {
  if (typeof name !== 'string') {
    return 'Name must be a valid string.';
  }
  const trimmed = name.trim();
  if (trimmed.length < 20 || trimmed.length > 60) {
    return 'Name must be between 20 and 60 characters.';
  }
  return null;
}

function validateEmail(email) {
  if (typeof email !== 'string') {
    return 'Email must be a valid string.';
  }
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Email must follow standard email format (e.g. user@example.com).';
  }
  return null;
}

function validatePassword(password) {
  if (typeof password !== 'string') {
    return 'Password must be a valid string.';
  }
  if (password.length < 8 || password.length > 16) {
    return 'Password must be between 8 and 16 characters.';
  }
  if (!UPPERCASE_REGEX.test(password)) {
    return 'Password must include at least one uppercase letter.';
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return 'Password must include at least one special character (!@#$%^&* etc.).';
  }
  return null;
}

function validateAddress(address) {
  if (typeof address !== 'string') {
    return 'Address must be a valid string.';
  }
  const trimmed = address.trim();
  if (trimmed.length === 0) {
    return 'Address is required.';
  }
  if (trimmed.length > 400) {
    return 'Address must not exceed 400 characters.';
  }
  return null;
}

function validateRating(rating) {
  const num = Number(rating);
  if (!Number.isInteger(num) || num < 1 || num > 5) {
    return 'Rating must be an integer between 1 and 5.';
  }
  return null;
}

/**
 * Express middleware for registration
 */
function validateRegistration(req, res, next) {
  const { name, email, password, address } = req.body;
  const errors = {};

  const nameErr = validateName(name);
  if (nameErr) errors.name = nameErr;

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(password);
  if (passErr) errors.password = passErr;

  const addrErr = validateAddress(address);
  if (addrErr) errors.address = addrErr;

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

/**
 * Express middleware for login
 */
function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = {};

  if (!email || !EMAIL_REGEX.test(String(email).trim())) {
    errors.email = 'Valid email is required.';
  }
  if (!password) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

/**
 * Express middleware for password update
 */
function validatePasswordUpdate(req, res, next) {
  const { currentPassword, newPassword } = req.body;
  const errors = {};

  if (!currentPassword) {
    errors.currentPassword = 'Current password is required.';
  }
  const passErr = validatePassword(newPassword);
  if (passErr) {
    errors.newPassword = passErr;
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

/**
 * Express middleware for Admin adding a user
 */
function validateAdminCreateUser(req, res, next) {
  const { name, email, password, address, role } = req.body;
  const errors = {};

  const nameErr = validateName(name);
  if (nameErr) errors.name = nameErr;

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  const passErr = validatePassword(password);
  if (passErr) errors.password = passErr;

  const addrErr = validateAddress(address);
  if (addrErr) errors.address = addrErr;

  const validRoles = ['ADMIN', 'USER', 'STORE_OWNER'];
  if (!role || !validRoles.includes(role)) {
    errors.role = 'Role must be one of: ADMIN, USER, STORE_OWNER.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

/**
 * Express middleware for adding a store
 */
function validateStore(req, res, next) {
  const { name, email, address } = req.body;
  const errors = {};

  if (!name || name.trim().length === 0) {
    errors.name = 'Store name is required.';
  } else if (name.trim().length > 60) {
    errors.name = 'Store name must not exceed 60 characters.';
  }

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  const addrErr = validateAddress(address);
  if (addrErr) errors.address = addrErr;

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
}

/**
 * Express middleware for rating submission
 */
function validateRatingSubmission(req, res, next) {
  const { rating } = req.body;
  const ratingErr = validateRating(rating);

  if (ratingErr) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: { rating: ratingErr }
    });
  }

  next();
}

module.exports = {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  validateRating,
  validateRegistration,
  validateLogin,
  validatePasswordUpdate,
  validateAdminCreateUser,
  validateStore,
  validateRatingSubmission
};
