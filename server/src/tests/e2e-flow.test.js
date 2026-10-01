const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const { initDatabase } = require('../config/db');

describe('End-to-End Reviewer Workflow (11-Step Verification)', () => {
  let server;
  let baseUrl;
  let normalUserToken;
  let normalUserId;
  let adminToken;
  let ownerToken;
  let createdStoreId;
  const uniqueSuffix = Date.now();
  const testUserEmail = `reviewer.tester.${uniqueSuffix}@qualitytest.com`;
  const testStoreEmail = `flagship.store.${uniqueSuffix}@qualitytest.com`;
  const testStoreName = `Apex Horizon Store ${uniqueSuffix}`;

  before(async () => {
    await initDatabase();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    try {
      const { query } = require('../config/db');
      if (createdStoreId) {
        await query('DELETE FROM ratings WHERE store_id = ?', [createdStoreId]);
        await query('DELETE FROM stores WHERE id = ?', [createdStoreId]);
      }
      if (normalUserId) {
        await query('DELETE FROM ratings WHERE user_id = ?', [normalUserId]);
        await query('DELETE FROM users WHERE id = ?', [normalUserId]);
      }
      await query('DELETE FROM users WHERE email LIKE "reviewer.tester.%"');
      await query('DELETE FROM stores WHERE email LIKE "flagship.store.%"');
    } catch (e) {
      // ignore cleanup errors
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('Step 1: Register a new user (with compliant name, email, password, address)', async () => {
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Veronica Danielle Sterling', // 27 chars (20-60 requirement)
        email: testUserEmail,
        password: 'Password@123', // 8-16 chars, 1 uppercase, 1 special char
        address: '742 Evergreen Terrace, Sector 4, Springfield' // <= 400 chars
      })
    });

    const data = await res.json();
    assert.equal(res.status, 201, `Expected status 201, got ${res.status}: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.ok(data.token, 'Token must be returned upon registration');
    assert.equal(data.user.role, 'USER');
    normalUserId = data.user.id;
  });

  test('Step 2: Login as the newly registered user', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'Password@123'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Expected status 200, got ${res.status}`);
    assert.equal(data.success, true);
    assert.ok(data.token, 'Valid JWT token returned on login');
    normalUserToken = data.token;
  });

  test('Step 3: Login as Admin and find the newly registered user in Admin Users list', async () => {
    // 3a. Admin Login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@storerating.com',
        password: 'Password@123'
      })
    });
    const loginData = await loginRes.json();
    assert.equal(loginRes.status, 200);
    adminToken = loginData.token;

    // 3b. Find user in Admin users list
    const usersRes = await fetch(`${baseUrl}/admin/users?search=${encodeURIComponent(testUserEmail)}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const usersData = await usersRes.json();
    assert.equal(usersRes.status, 200);
    assert.ok(usersData.users.length > 0, 'New user must appear in admin search');
    const found = usersData.users.find(u => u.email === testUserEmail);
    assert.ok(found, 'Created user matching email found in admin list');
    assert.equal(found.name, 'Veronica Danielle Sterling');
  });

  test('Step 4: Create a new store via Admin Console', async () => {
    // Assign store to Alexander John Henderson (user id 2 from seed)
    const res = await fetch(`${baseUrl}/admin/stores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: testStoreName,
        email: testStoreEmail,
        address: '500 Innovation Way, Silicon Galleria, Tech Hub',
        ownerId: 2
      })
    });

    const data = await res.json();
    assert.equal(res.status, 201, `Failed creating store: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.ok(data.store.id, 'Store ID must be generated and returned');
    createdStoreId = data.store.id;
  });

  test('Step 5: Submit a new rating (4 Stars) as Normal User', async () => {
    const res = await fetch(`${baseUrl}/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalUserToken}`
      },
      body: JSON.stringify({ rating: 4 })
    });

    const data = await res.json();
    assert.equal(res.status, 201, `Rating submission failed: ${JSON.stringify(data)}`);
    assert.equal(data.success, true);
    assert.equal(data.rating.userRating, 4);
    assert.equal(data.rating.overallRating, 4);
  });

  test('Step 6 & 7: Refresh store list and verify submitted rating persists', async () => {
    const res = await fetch(`${baseUrl}/stores?search=${encodeURIComponent(testStoreName)}`, {
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.stores.length > 0, 'Store should be listed');
    const store = data.stores.find(s => s.id === createdStoreId);
    assert.ok(store, 'Target store found in store list');
    assert.equal(store.userRating, 4, 'User rating should persist as 4');
    assert.equal(store.overallRating, 4.0, 'Platform overall rating should reflect 4.0');
    assert.equal(store.totalRatings, 1, 'Total ratings count should be 1');
  });

  test('Step 8: Login as Store Owner (Alexander John Henderson)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alexander@hendersonretail.com',
        password: 'Password@123'
      })
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.user.role, 'STORE_OWNER');
    ownerToken = data.token;
  });

  test('Step 9: Store Owner sees the rating on their dashboard', async () => {
    const res = await fetch(`${baseUrl}/owner/dashboard?storeId=${createdStoreId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200, `Failed retrieving owner dashboard: ${JSON.stringify(data)}`);
    assert.equal(data.hasStore, true);
    assert.equal(data.averageRating, 4);
    assert.equal(data.totalRatings, 1);
    assert.ok(data.ratings.length > 0);
    const userRating = data.ratings.find(r => r.user.email === testUserEmail);
    assert.ok(userRating, 'Owner should see rating from Veronica Danielle Sterling');
    assert.equal(userRating.rating, 4);
  });

  test('Step 10: Admin Dashboard reflects updated platform statistics', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const data = await res.json();
    assert.equal(res.status, 200);
    assert.ok(data.stats.totalUsers >= 7, 'Total users increased');
    assert.ok(data.stats.totalStores >= 4, 'Total stores increased');
    assert.ok(data.stats.totalRatings >= 4, 'Total ratings increased');
  });

  test('Step 11: Modify rating from 4 to 5 and verify updated values', async () => {
    // PUT modification
    const modRes = await fetch(`${baseUrl}/stores/${createdStoreId}/ratings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalUserToken}`
      },
      body: JSON.stringify({ rating: 5 })
    });

    const modData = await modRes.json();
    assert.equal(modRes.status, 200);
    assert.equal(modData.rating.userRating, 5);
    assert.equal(modData.rating.overallRating, 5);

    // Verify duplicate POST is rejected with 409 Conflict
    const dupRes = await fetch(`${baseUrl}/stores/${createdStoreId}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalUserToken}`
      },
      body: JSON.stringify({ rating: 5 })
    });
    assert.equal(dupRes.status, 409, 'Duplicate POST must be rejected with 409 Conflict');
  });

  test('Step 12: Delete submitted rating and verify removal', async () => {
    // DELETE rating
    const delRes = await fetch(`${baseUrl}/stores/${createdStoreId}/ratings`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });

    const delData = await delRes.json();
    assert.equal(delRes.status, 200, `Expected 200 OK: ${JSON.stringify(delData)}`);
    assert.equal(delData.success, true);
    assert.equal(delData.rating.userRating, null);

    // Verify store catalog shows userRating = null
    const listRes = await fetch(`${baseUrl}/stores`, {
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    const listData = await listRes.json();
    const ratedStore = listData.stores.find(s => s.id === createdStoreId);
    assert.ok(ratedStore);
    assert.equal(ratedStore.userRating, null, 'userRating should now be null');

    // Deleting again returns 404 Not Found
    const delAgainRes = await fetch(`${baseUrl}/stores/${createdStoreId}/ratings`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    assert.equal(delAgainRes.status, 404, 'Deleting non-existent rating must return 404');
  });

});
