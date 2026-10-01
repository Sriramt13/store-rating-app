const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const { initDatabase } = require('../config/db');

describe('Security, Validation & Role Authorization Enforcement', () => {
  let server;
  let baseUrl;
  let normalUserToken;
  let ownerToken;
  let adminToken;

  before(async () => {
    await initDatabase();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });

    // Login as normal user
    const userRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'christopher@moviefan.com', password: 'Password@123' })
    });
    const userData = await userRes.json();
    normalUserToken = userData.token;

    // Login as store owner
    const ownerRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alexander@hendersonretail.com', password: 'Password@123' })
    });
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.token;

    // Login as admin
    const adminRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@storerating.com', password: 'Password@123' })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;
  });

  after(async () => {
    try {
      const { query } = require('../config/db');
      await query('DELETE FROM users WHERE email LIKE "sriram.%" OR email LIKE "shortname.%" OR email LIKE "weakpass.%" OR email LIKE "nospecial.%"');
    } catch (e) {
      // ignore cleanup errors
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Strict Name Validation (Min 20, Max 60 characters)', () => {
    test('should reject short name like "John" (<20 chars) with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'John', // only 4 chars
          email: `shortname.${Date.now()}@test.com`,
          password: 'Password@123',
          address: '100 Sample Avenue, Downtown'
        })
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.equal(data.success, false);
      assert.ok(data.errors && data.errors.name, 'Expected name error in response');
    });

    test('should accept compliant name like "Sri Ram Teja Pinnamireddy" (>20 chars)', async () => {
      const email = `sriram.${Date.now()}@test.com`;
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sri Ram Teja Pinnamireddy', // 25 chars
          email,
          password: 'Password@123',
          address: 'Plot 42, Tech Innovation Boulevard, HiTech City'
        })
      });

      const data = await res.json();
      assert.equal(res.status, 201);
      assert.equal(data.success, true);
      assert.equal(data.user.name, 'Sri Ram Teja Pinnamireddy');
    });
  });

  describe('Password Constraints (8-16 chars, >= 1 uppercase, >= 1 special char)', () => {
    test('should reject "password123" (missing uppercase and special character)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Benjamin Franklin Test Account',
          email: `weakpass.${Date.now()}@test.com`,
          password: 'password123',
          address: '456 Sample Street'
        })
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.ok(data.errors && data.errors.password);
    });

    test('should reject "PASSWORD123" (missing special character)', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Benjamin Franklin Test Account',
          email: `nospecial.${Date.now()}@test.com`,
          password: 'PASSWORD123',
          address: '456 Sample Street'
        })
      });

      const data = await res.json();
      assert.equal(res.status, 400);
      assert.ok(data.errors && data.errors.password);
    });
  });

  describe('Backend Role-Based Access Control (RBAC)', () => {
    test('Normal User cannot call POST /api/admin/users (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${normalUserToken}`
        },
        body: JSON.stringify({
          name: 'Hacked Administrator Account',
          email: 'hacker@admin.com',
          password: 'Password@123',
          address: 'Unknown Hacker Hideout',
          role: 'ADMIN'
        })
      });

      assert.equal(res.status, 403, 'Normal user must be forbidden from adding users');
    });

    test('Normal User cannot call GET /api/admin/dashboard (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${normalUserToken}` }
      });
      assert.equal(res.status, 403);
    });

    test('Normal User cannot call GET /api/owner/dashboard (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/owner/dashboard`, {
        headers: { Authorization: `Bearer ${normalUserToken}` }
      });
      assert.equal(res.status, 403);
    });

    test('Store Owner cannot call POST /api/admin/stores (403 Forbidden)', async () => {
      const res = await fetch(`${baseUrl}/admin/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`
        },
        body: JSON.stringify({
          name: 'Unauthorized Owner Store Addition',
          email: 'unauthorized@store.com',
          address: 'Nowhere Lane'
        })
      });
      assert.equal(res.status, 403);
    });

    test('Unauthenticated user cannot submit ratings (401 Unauthorized)', async () => {
      const res = await fetch(`${baseUrl}/stores/1/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: 5 })
      });
      assert.equal(res.status, 401);
    });
  });

  describe('One Rating Per User Per Store Enforcement', () => {
    test('Duplicate POST rating submission from same user is rejected with 409 Conflict', async () => {
      // Christopher already has a rating on Henderson Tech Superstore (store 1) in seed data
      const res = await fetch(`${baseUrl}/stores/1/ratings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${normalUserToken}`
        },
        body: JSON.stringify({ rating: 4 })
      });

      const data = await res.json();
      assert.equal(res.status, 409, 'Duplicate rating POST must return 409 Conflict');
      assert.equal(data.success, false);
      assert.ok(data.message.includes('already submitted a rating'));
    });
  });

});
