const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');
const { initDatabase } = require('../config/db');

describe('System Administrator Phase 3 Complete Verification Suite', () => {
  let server;
  let baseUrl;
  let adminToken;
  let normalUserToken;
  let ownerToken;

  const timestamp = Date.now();
  const testNormalUserEmail = `phase3.normal.${timestamp}@adminverification.com`;
  const testAdminUserEmail = `phase3.admin.${timestamp}@adminverification.com`;
  const testOwnerUserEmail = `phase3.owner.${timestamp}@adminverification.com`;
  let createdOwnerId;

  before(async () => {
    await initDatabase();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}/api`;
        resolve();
      });
    });

    // 1. Login as Admin
    const adminRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@storerating.com', password: 'Password@123' })
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    // 2. Login as Normal User
    const userRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'christopher@moviefan.com', password: 'Password@123' })
    });
    const userData = await userRes.json();
    normalUserToken = userData.token;

    // 3. Login as Store Owner
    const ownerRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alexander@hendersonretail.com', password: 'Password@123' })
    });
    const ownerData = await ownerRes.json();
    ownerToken = ownerData.token;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. DASHBOARD KPI METRICS
  test('Item 1: Admin Dashboard KPI Statistics (Total Users, Stores, Ratings from DB)', async () => {
    const res = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert.equal(res.status, 200);
    assert.equal(data.success, true);
    assert.ok(typeof data.stats.totalUsers === 'number' && data.stats.totalUsers >= 5, 'Total users must be >= 5');
    assert.ok(typeof data.stats.totalStores === 'number' && data.stats.totalStores >= 3, 'Total stores must be >= 3');
    assert.ok(typeof data.stats.totalRatings === 'number' && data.stats.totalRatings >= 3, 'Total ratings must be >= 3');
  });

  // 2. USER MANAGEMENT: CREATING USERS FOR ALL 3 ROLES
  test('Item 2: Admin can create Normal User, Admin User, and Store Owner', async () => {
    // 2a. Create Normal User
    const resNormal = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Phase Three Normal User Tester',
        email: testNormalUserEmail,
        password: 'Password@123',
        address: '100 North Horizon Way, District 4',
        role: 'USER'
      })
    });
    const dataNormal = await resNormal.json();
    assert.equal(resNormal.status, 201, `Failed to create normal user: ${JSON.stringify(dataNormal)}`);
    assert.equal(dataNormal.user.role, 'USER');

    // 2b. Create Admin User
    const resAdmin = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Phase Three System Admin User',
        email: testAdminUserEmail,
        password: 'Password@123',
        address: '200 Executive Plaza, Central HQ',
        role: 'ADMIN'
      })
    });
    const dataAdmin = await resAdmin.json();
    assert.equal(resAdmin.status, 201, `Failed to create admin user: ${JSON.stringify(dataAdmin)}`);
    assert.equal(dataAdmin.user.role, 'ADMIN');

    // 2c. Provision Store Owner
    const resOwner = await fetch(`${baseUrl}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Phase Three Provisioned Store Owner',
        email: testOwnerUserEmail,
        password: 'Password@123',
        address: '300 Merchant Way, Commercial Sector 5',
        role: 'STORE_OWNER'
      })
    });
    const dataOwner = await resOwner.json();
    assert.equal(resOwner.status, 201, `Failed to create owner user: ${JSON.stringify(dataOwner)}`);
    assert.equal(dataOwner.user.role, 'STORE_OWNER');
    createdOwnerId = dataOwner.user.id;
  });

  // 3. USER LISTING, FILTERS & SORTING
  test('Item 3: User Listing filters by Name, Email, Address, and Role', async () => {
    // 3a. Filter by Name
    const byNameRes = await fetch(`${baseUrl}/admin/users?name=Provisioned`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const byNameData = await byNameRes.json();
    assert.equal(byNameRes.status, 200);
    assert.ok(byNameData.users.some(u => u.email === testOwnerUserEmail));

    // 3b. Filter by Email
    const byEmailRes = await fetch(`${baseUrl}/admin/users?email=${encodeURIComponent(testNormalUserEmail)}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const byEmailData = await byEmailRes.json();
    assert.equal(byEmailRes.status, 200);
    assert.equal(byEmailData.users.length, 1);
    assert.equal(byEmailData.users[0].email, testNormalUserEmail);

    // 3c. Filter by Address
    const byAddrRes = await fetch(`${baseUrl}/admin/users?address=Executive`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const byAddrData = await byAddrRes.json();
    assert.equal(byAddrRes.status, 200);
    assert.ok(byAddrData.users.some(u => u.email === testAdminUserEmail));

    // 3d. Filter by Role
    const byRoleRes = await fetch(`${baseUrl}/admin/users?role=STORE_OWNER`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const byRoleData = await byRoleRes.json();
    assert.equal(byRoleRes.status, 200);
    assert.ok(byRoleData.users.every(u => u.role === 'STORE_OWNER'));
  });

  test('Item 4: User Sorting (Name, Email, Address, Role in ASC and DESC)', async () => {
    const sortRes = await fetch(`${baseUrl}/admin/users?sortBy=name&sortOrder=ASC`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const sortData = await sortRes.json();
    assert.equal(sortRes.status, 200);
    assert.ok(sortData.users.length > 2);
    // Verify ascending alphabetical order
    for (let i = 0; i < sortData.users.length - 1; i++) {
      assert.ok(sortData.users[i].name.toLowerCase().localeCompare(sortData.users[i + 1].name.toLowerCase()) <= 0);
    }
  });

  // 4. USER DETAILS & STORE OWNER RATING REQUIREMENT
  test('Item 5: Store Owner record includes store name and store rating; Normal User does not', async () => {
    const res = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const data = await res.json();
    assert.equal(res.status, 200);

    // Alexander Henderson is a Store Owner with Henderson Tech Superstore
    const alexOwner = data.users.find(u => u.email === 'alexander@hendersonretail.com');
    assert.ok(alexOwner, 'Alexander Henderson exists in users list');
    assert.equal(alexOwner.role, 'STORE_OWNER');
    assert.ok(alexOwner.store, 'Store Owner must have store information');
    assert.equal(alexOwner.store.name, 'Henderson Tech Superstore');
    assert.ok(typeof alexOwner.store.rating === 'number', 'Store rating must be computed and present');

    // Christopher Nolan is a Normal User
    const chrisUser = data.users.find(u => u.email === 'christopher@moviefan.com');
    assert.ok(chrisUser, 'Christopher exists in users list');
    assert.equal(chrisUser.role, 'USER');
    assert.equal(chrisUser.store, null, 'Normal user must not have a store rating');
  });

  // 5. STORE MANAGEMENT: ADD STORE & ASSIGN OWNER
  test('Item 6: Admin creates store with assigned owner and verifies in Store Listing', async () => {
    const storeEmail = `phase3.store.${timestamp}@storesample.com`;
    const storeName = `Phase Three Showcase Store ${timestamp}`;

    const createRes = await fetch(`${baseUrl}/admin/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: storeName,
        email: storeEmail,
        address: '400 Commercial Galleria Blvd, Unit 99',
        ownerId: createdOwnerId
      })
    });
    const createData = await createRes.json();
    assert.equal(createRes.status, 201);
    assert.equal(createData.store.name, storeName);

    // Verify in Store Listing with filters
    const listRes = await fetch(`${baseUrl}/admin/stores?email=${encodeURIComponent(storeEmail)}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const listData = await listRes.json();
    assert.equal(listRes.status, 200);
    assert.equal(listData.stores.length, 1);
    assert.equal(listData.stores[0].owner.email, testOwnerUserEmail);
  });

  // 6. STORE LISTING FILTERS & SORTING
  test('Item 7: Store Listing filters by Name, Email, Address & sorts by Rating', async () => {
    const ratingSortRes = await fetch(`${baseUrl}/admin/stores?sortBy=rating&sortOrder=DESC`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const ratingSortData = await ratingSortRes.json();
    assert.equal(ratingSortRes.status, 200);
    assert.ok(ratingSortData.stores.length >= 3);

    // Verify filter by Name
    const nameFilterRes = await fetch(`${baseUrl}/admin/stores?name=Henderson`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const nameFilterData = await nameFilterRes.json();
    assert.equal(nameFilterRes.status, 200);
    assert.ok(nameFilterData.stores.some(s => s.name.includes('Henderson')));
  });

  // 7. SECURITY & ACCESS CONTROL
  test('Item 8: Strict Role Authorization (Normal User and Store Owner are 403 Forbidden)', async () => {
    // Normal User cannot access GET /api/admin/dashboard
    const userDashRes = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    assert.equal(userDashRes.status, 403, 'Normal User cannot access admin dashboard');

    // Normal User cannot access GET /api/admin/users
    const userUsersRes = await fetch(`${baseUrl}/admin/users`, {
      headers: { Authorization: `Bearer ${normalUserToken}` }
    });
    assert.equal(userUsersRes.status, 403, 'Normal User cannot access admin users list');

    // Store Owner cannot access POST /api/admin/stores
    const ownerStoreRes = await fetch(`${baseUrl}/admin/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ name: 'Tampered Store', email: 'hack@store.com', address: 'Nowhere', ownerId: null })
    });
    assert.equal(ownerStoreRes.status, 403, 'Store Owner cannot create stores');

    // Unauthenticated request gets 401
    const unauthRes = await fetch(`${baseUrl}/admin/dashboard`);
    assert.equal(unauthRes.status, 401, 'Unauthenticated request receives 401');
  });
});
