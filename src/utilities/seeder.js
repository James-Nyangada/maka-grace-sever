const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

const seedAdminUsers = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Seeding default admin users...');

      const hashedJamesPassword = await bcrypt.hash('Messijunior14', 10);
      const hashedMakaPassword = await bcrypt.hash('Makagrace@2026', 10);

      const users = [
        {
          name: 'James Edwin',
          email: 'jamesedwin03@gmail.com',
          password: hashedJamesPassword,
          role: 'super-admin',
          isActive: true
        },
        {
          name: 'Maka Grace Admin',
          email: 'info@makagracetravel.co.ke',
          password: hashedMakaPassword,
          role: 'super-admin',
          isActive: true
        }
      ];

      await User.insertMany(users);
      console.log('Default admin users seeded successfully.');
    } else {
      console.log('Users already exist in database. Skipping seeder.');
    }
  } catch (error) {
    console.error('Error seeding admin users:', error);
  }
};

module.exports = seedAdminUsers;
