const bcrypt = require('bcryptjs');
const { initDatabase, query } = require('../config/db');

async function seed() {
  console.log('[Seed] Starting database seed process...');
  try {
    await initDatabase();

    // Check if admin already exists
    const existingAdmin = await query('SELECT id FROM users WHERE email = ?', ['admin@storerating.com']);
    if (existingAdmin.length > 0) {
      console.log('[Seed] Admin user already exists. Database already seeded or populated.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Password@123', 10);

    // 1. Seed Users
    console.log('[Seed] Inserting initial users...');
    const users = [
      {
        name: 'System Administrator Account',
        email: 'admin@storerating.com',
        password: hashedPassword,
        address: '100 Innovation Boulevard, Suite 500, Tech District, City Center',
        role: 'ADMIN'
      },
      {
        name: 'Alexander John Henderson',
        email: 'alexander@hendersonretail.com',
        password: hashedPassword,
        address: '450 Emerald Market Avenue, Sector 12, Commercial Zone',
        role: 'STORE_OWNER'
      },
      {
        name: 'Beatrice Eleanor Vance',
        email: 'beatrice@vanceartisans.com',
        password: hashedPassword,
        address: '782 Artisan Craft Street, Westside Artisan Square',
        role: 'STORE_OWNER'
      },
      {
        name: 'Christopher David Nolan',
        email: 'christopher@moviefan.com',
        password: hashedPassword,
        address: '12 Sunset Heights Boulevard, Oakridge Hills',
        role: 'USER'
      },
      {
        name: 'Dominic Marcus Reynolds',
        email: 'dominic.reynolds@sample.com',
        password: hashedPassword,
        address: '99 Maplewood Drive, Apartment 4B, North Hill',
        role: 'USER'
      },
      {
        name: 'Elizabeth Grace Montgomery',
        email: 'elizabeth.montgomery@sample.com',
        password: hashedPassword,
        address: '304 Riverside Promenade, Harbor District',
        role: 'USER'
      }
    ];

    const userMap = {};
    for (const u of users) {
      const res = await query(
        'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
        [u.name, u.email, u.password, u.address, u.role]
      );
      userMap[u.email] = res.insertId;
    }

    // 2. Seed Stores
    console.log('[Seed] Inserting stores...');
    const stores = [
      {
        name: 'Henderson Tech Superstore',
        email: 'contact@hendersonstore.com',
        address: '450 Emerald Market Avenue, Sector 12, Commercial Zone',
        owner_id: userMap['alexander@hendersonretail.com']
      },
      {
        name: 'Vance Handcrafted Furnishings',
        email: 'support@vancefurnishings.com',
        address: '782 Artisan Craft Street, Westside Artisan Square',
        owner_id: userMap['beatrice@vanceartisans.com']
      },
      {
        name: 'Apex Organic Gourmet Market',
        email: 'hello@apexorganicmarket.com',
        address: '55 Green Valley Plaza, Boulevard 9',
        owner_id: null
      }
    ];

    const storeMap = {};
    for (const s of stores) {
      const res = await query(
        'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
        [s.name, s.email, s.address, s.owner_id]
      );
      storeMap[s.name] = res.insertId;
    }

    // 3. Seed Ratings
    console.log('[Seed] Inserting initial ratings...');
    const ratings = [
      {
        userId: userMap['christopher@moviefan.com'],
        storeId: storeMap['Henderson Tech Superstore'],
        rating: 4
      },
      {
        userId: userMap['dominic.reynolds@sample.com'],
        storeId: storeMap['Henderson Tech Superstore'],
        rating: 5
      },
      {
        userId: userMap['elizabeth.montgomery@sample.com'],
        storeId: storeMap['Henderson Tech Superstore'],
        rating: 4
      },
      {
        userId: userMap['dominic.reynolds@sample.com'],
        storeId: storeMap['Vance Handcrafted Furnishings'],
        rating: 5
      },
      {
        userId: userMap['elizabeth.montgomery@sample.com'],
        storeId: storeMap['Apex Organic Gourmet Market'],
        rating: 3
      }
    ];

    for (const r of ratings) {
      await query(
        'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating)',
        [r.userId, r.storeId, r.rating]
      );
    }

    console.log('[Seed] Seed completed successfully!');
    console.log('[Seed] Default credentials:');
    console.log('       Admin:       admin@storerating.com / Password@123');
    console.log('       Store Owner: alexander@hendersonretail.com / Password@123');
    console.log('       Store Owner: beatrice@vanceartisans.com / Password@123');
    console.log('       User:        christopher@moviefan.com / Password@123');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error.message);
    process.exit(1);
  }
}

seed();
