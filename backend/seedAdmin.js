const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const adminFilePath = path.join(__dirname, 'data', 'admins.json');

async function seedAdmin() {
  try {
    // Create data directory if it doesn't exist
    try {
      await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Check if admins.json exists
    let admins = [];
    try {
      const data = await fs.readFile(adminFilePath, 'utf8');
      admins = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      // File doesn't exist, will create it
    }

    // Check if admin already exists
    if (admins.some(admin => admin.username === 'admin')) {
      console.log('Admin user already exists!');
      return;
    }

    // Create default admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const newAdmin = {
      id: uuidv4(),
      username: 'admin',
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    admins.push(newAdmin);

    // Save to file
    await fs.writeFile(adminFilePath, JSON.stringify(admins, null, 2));

    console.log('Default admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();
