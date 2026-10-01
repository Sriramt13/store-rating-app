const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const { initDatabase } = require('../config/db');

describe('Store Owner Data Relationship & Isolation Suite', () => {
  let server;
  let baseUrl;
  let alexToken;
  let beatriceToken;
  let normalUserToken;

  before(async () => {
    await initDatabase();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });

    // 1. Login as Store Owner Alexander (Henderson Tech Superstore, id=1)
    const alexRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alexander@hendersonretail.com', password: 'Password@123' })
    });
    const alexData = await alexRes.json();
    alexToken = alexData.token;

    // 2. Login as Store Owner Beatrice (Vance Handcrafted Furnishings, id=2)
    const beatriceRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'beatrice@vanceartisans.com', password: 'Password@123' })
    });
    const beatriceData = await beatriceRes.json();
    beatriceToken = beatriceData.token;

    // 3. Login as Normal User Christopher
    const userRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'christopher@moviefan.com', password: 'Password@123' })
    });
    const userData = await userRes.json();
    normalUserToken = userData.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('Part 1: Normal User rates Henderson -> Owner Dashboard reflects new rating, count and recomputed average', async () => {
    // A. Alexander fetches initial dashboard
    const dash1Res = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${alexToken}` }
    });
    const dash1 = await dash1Res.json();
    assert.equal(dash1Res.status, 200);
    assert.equal(dash1.store.name, 'Henderson Tech Superstore');

    // B. Christopher sets rating to 1 star
    const putRes = await fetch(`${baseUrl}/stores/1/ratings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalUserToken}`
      },
      body: JSON.stringify({ rating: 1 })
    });
    assert.equal(putRes.status, 200);

    // C. Alexander refreshes dashboard
    const dash2Res = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${alexToken}` }
    });
    const dash2 = await dash2Res.json();
    assert.equal(dash2Res.status, 200);

    const chrisEntry = dash2.ratings.find(r => r.user.email === 'christopher@moviefan.com');
    assert.ok(chrisEntry, 'Christopher rating must appear in Alexander table');
    assert.equal(chrisEntry.rating, 1, 'Christopher rating must show 1 star');
    assert.ok(dash2.averageRating < 4.5, 'Average rating must dynamically adjust down for a 1-star review');

    // D. Christopher updates rating to 5 stars
    const putRes5 = await fetch(`${baseUrl}/stores/1/ratings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${normalUserToken}`
      },
      body: JSON.stringify({ rating: 5 })
    });
    assert.equal(putRes5.status, 200);

    // E. Alexander refreshes dashboard again
    const dash3Res = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${alexToken}` }
    });
    const dash3 = await dash3Res.json();
    assert.equal(dash3Res.status, 200);

    const chrisEntry5 = dash3.ratings.find(r => r.user.email === 'christopher@moviefan.com');
    assert.equal(chrisEntry5.rating, 5, 'Christopher rating must update to 5 stars');
    assert.ok(dash3.averageRating > dash2.averageRating, 'Average rating must dynamically increase for a 5-star review');
  });

  test('Part 2: Store Owner Alexander cannot access Store 2 (Vance) via URL/API parameter tampering (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/owner/dashboard?storeId=2`, {
      headers: { Authorization: `Bearer ${alexToken}` }
    });
    const data = await res.json();
    assert.equal(res.status, 403, 'Alexander querying Store 2 must be rejected with 403 Forbidden');
    assert.equal(data.success, false);
    assert.match(data.message, /Access Denied/i);
  });

  test('Part 3: Store Owner Beatrice only sees her store (Vance) and cannot see Henderson customer ratings', async () => {
    const res = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${beatriceToken}` }
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.store.name, 'Vance Handcrafted Furnishings');

    // Beatrice must not see ratings from users that rated Henderson
    const hasHendersonReviews = data.ratings.some(r => r.user.email === 'christopher@moviefan.com');
    assert.equal(hasHendersonReviews, false, 'Beatrice must never receive rating records belonging to another store');
  });

  test('Part 4: Store Owner Beatrice cannot access Store 1 (Henderson) via URL parameter tampering (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/owner/dashboard?storeId=1`, {
      headers: { Authorization: `Bearer ${beatriceToken}` }
    });
    const data = await res.json();
    assert.equal(res.status, 403, 'Beatrice querying Store 1 must be rejected with 403 Forbidden');
    assert.equal(data.success, false);
    assert.match(data.message, /Access Denied/i);
  });

  test('Part 5: Normal User cannot access /owner/dashboard (403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/owner/dashboard`, {
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    assert.equal(res.status, 403, 'Normal user must be forbidden from accessing owner dashboard');
  });
});
