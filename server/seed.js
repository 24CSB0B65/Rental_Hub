const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

function upsertUser(name, email, password, role) {
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (user) return user;
  const id = uuidv4();
  db.prepare('INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)')
    .run(id, name, email, bcrypt.hashSync(password, 10), role);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

const owner = upsertUser('Priya Sharma', 'owner@demo.com', 'password123', 'owner');
const owner2 = upsertUser('Alex Chen', 'owner2@demo.com', 'password123', 'owner');
const renter = upsertUser('Jordan Lee', 'renter@demo.com', 'password123', 'renter');

const sampleProperties = [
  {
    owner: owner.id, title: 'Sunny 2BHK near Tech Park', description: 'Bright, well-ventilated apartment close to the IT corridor with 24/7 water and power backup.',
    property_type: 'apartment', address: '14 Lakeview Road, Gachibowli', city: 'Hyderabad', price: 22000,
    bedrooms: 2, bathrooms: 2, area_sqft: 1100, latitude: 17.4401, longitude: 78.3489,
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
  },
  {
    owner: owner.id, title: 'Cozy Studio in City Center', description: 'Compact studio ideal for a single professional, walking distance to metro.',
    property_type: 'studio', address: '22 MG Road', city: 'Bengaluru', price: 15000,
    bedrooms: 1, bathrooms: 1, area_sqft: 550, latitude: 12.9756, longitude: 77.6068,
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
  },
  {
    owner: owner2.id, title: 'Spacious 3BHK Family Home', description: 'Gated community villa with garden, parking for two cars, and children\'s play area.',
    property_type: 'house', address: '7 Palm Grove Layout', city: 'Bengaluru', price: 38000,
    bedrooms: 3, bathrooms: 3, area_sqft: 1800, latitude: 12.9352, longitude: 77.6245,
    image_url: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800'
  },
  {
    owner: owner2.id, title: 'Modern 1BHK with Lake View', description: 'Newly renovated apartment overlooking Hussain Sagar lake.',
    property_type: 'apartment', address: '3 Necklace Road', city: 'Hyderabad', price: 18500,
    bedrooms: 1, bathrooms: 1, area_sqft: 700, latitude: 17.4239, longitude: 78.4738,
    image_url: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800'
  },
  {
    owner: owner.id, title: 'Shared PG Accommodation', description: 'Furnished room in a shared apartment, meals included, near university.',
    property_type: 'pg', address: '9 College Street', city: 'Pune', price: 9000,
    bedrooms: 1, bathrooms: 1, area_sqft: 300, latitude: 18.5204, longitude: 73.8567,
    image_url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'
  }
];

const existingCount = db.prepare('SELECT COUNT(*) AS c FROM properties').get().c;
if (existingCount === 0) {
  const insert = db.prepare(`
    INSERT INTO properties (id, owner_id, title, description, property_type, address, city, price, bedrooms, bathrooms, area_sqft, latitude, longitude, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of sampleProperties) {
    insert.run(uuidv4(), p.owner, p.title, p.description, p.property_type, p.address, p.city, p.price, p.bedrooms, p.bathrooms, p.area_sqft, p.latitude, p.longitude, p.image_url);
  }
  console.log(`Seeded ${sampleProperties.length} properties.`);
} else {
  console.log('Properties already exist, skipping property seed.');
}

console.log('\nDemo accounts:');
console.log('  Owner:  owner@demo.com  / password123');
console.log('  Owner2: owner2@demo.com / password123');
console.log('  Renter: renter@demo.com / password123');
