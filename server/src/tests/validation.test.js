const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  validateRating
} = require('../middleware/validator');

describe('Form Validation Constraints (Challenge Specification)', () => {

  describe('Name Validation (Min 20 characters, Max 60 characters)', () => {
    test('should reject names shorter than 20 characters', () => {
      assert.ok(validateName('John Doe')); // 8 chars
      assert.ok(validateName('Short Name 1234567')); // 19 chars
    });

    test('should reject names longer than 60 characters', () => {
      const longName = 'A'.repeat(61);
      assert.ok(validateName(longName));
    });

    test('should accept names between 20 and 60 characters', () => {
      assert.equal(validateName('Alexander John Henderson'), null); // 24 chars
      assert.equal(validateName('A'.repeat(20)), null);
      assert.equal(validateName('A'.repeat(60)), null);
    });
  });

  describe('Address Validation (Max 400 characters, required)', () => {
    test('should reject empty or whitespace address', () => {
      assert.ok(validateAddress(''));
      assert.ok(validateAddress('    '));
    });

    test('should reject address exceeding 400 characters', () => {
      const longAddress = 'X'.repeat(401);
      assert.ok(validateAddress(longAddress));
    });

    test('should accept valid address up to 400 characters', () => {
      assert.equal(validateAddress('450 Emerald Market Avenue, Sector 12, Commercial Zone'), null);
      assert.equal(validateAddress('X'.repeat(400)), null);
    });
  });

  describe('Password Validation (8-16 chars, >= 1 uppercase, >= 1 special char)', () => {
    test('should reject passwords shorter than 8 characters', () => {
      assert.ok(validatePassword('Pass@1')); // 6 chars
    });

    test('should reject passwords longer than 16 characters', () => {
      assert.ok(validatePassword('Password12345678@Long')); // >16 chars
    });

    test('should reject passwords without uppercase letter', () => {
      assert.ok(validatePassword('password@123')); // no uppercase
    });

    test('should reject passwords without special character', () => {
      assert.ok(validatePassword('Password1234')); // no special character
    });

    test('should accept compliant passwords', () => {
      assert.equal(validatePassword('Password@123'), null);
      assert.equal(validatePassword('Secure#2026'), null);
      assert.equal(validatePassword('Abcdefg!'), null); // exactly 8 chars
      assert.equal(validatePassword('Abcdefghij12345!'), null); // exactly 16 chars
    });
  });

  describe('Email Validation (Standard email pattern)', () => {
    test('should reject invalid email formats', () => {
      assert.ok(validateEmail('not-an-email'));
      assert.ok(validateEmail('user@'));
      assert.ok(validateEmail('user@domain'));
      assert.ok(validateEmail('@domain.com'));
    });

    test('should accept standard email formats', () => {
      assert.equal(validateEmail('user@example.com'), null);
      assert.equal(validateEmail('admin@storerating.com'), null);
      assert.equal(validateEmail('first.last@company.co.in'), null);
    });
  });

  describe('Rating Validation (Integer between 1 and 5)', () => {
    test('should reject non-integers, strings, and out-of-range values', () => {
      assert.ok(validateRating(0));
      assert.ok(validateRating(6));
      assert.ok(validateRating(3.5));
      assert.ok(validateRating(-1));
      assert.ok(validateRating('invalid'));
    });

    test('should accept valid integer ratings 1 through 5', () => {
      assert.equal(validateRating(1), null);
      assert.equal(validateRating(2), null);
      assert.equal(validateRating(3), null);
      assert.equal(validateRating(4), null);
      assert.equal(validateRating(5), null);
    });
  });

});
