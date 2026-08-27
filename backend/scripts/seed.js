/**
 * Seed script — creates the admin user and default collections.
 * Run once: node scripts/seed.js
 */
require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const User = require('../src/models/User');
  const Collection = require('../src/models/Collection');

  // Create admin user
  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!existing) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await User.create({
      name: process.env.ADMIN_NAME || 'IIIT Pune Admin',
      email: process.env.ADMIN_EMAIL || 'admin@iiitp.ac.in',
      passwordHash,
      role: 'admin',
    });
    console.log(`✅ Admin user created: ${process.env.ADMIN_EMAIL}`);
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Create default collections matching seed-documents folder structure
  const defaultCollections = [
    { name: 'Admissions', description: 'Admission brochures, JoSAA info, eligibility criteria' },
    { name: 'Departments', description: 'CSE, ECE and other department information' },
    { name: 'Fee Structure', description: 'Fee schedules and payment details' },
    { name: 'Academic Calendar', description: 'Semester schedules and important dates' },
    { name: 'Hostel', description: 'Hostel rules, facilities, and allocation' },
    { name: 'Library', description: 'Library resources and rules' },
    { name: 'Clubs', description: 'Student clubs and activities' },
    { name: 'Placements', description: 'Placement statistics and company information' },
    { name: 'Scholarships', description: 'Available scholarships and eligibility' },
    { name: 'Policies', description: 'Institute policies and regulations' },
    { name: 'Events', description: 'Events, fests, and announcements' },
  ];

  for (const col of defaultCollections) {
    const exists = await Collection.findOne({ name: col.name });
    if (!exists) {
      await Collection.create(col);
      console.log(`✅ Collection created: ${col.name}`);
    }
  }

  console.log('\n🎉 Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
