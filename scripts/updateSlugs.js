require('dotenv').config({ path: './.env' }); // Run from server root
const mongoose = require('mongoose');
const Package = require('../src/models/Package');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.CONNECTION_STRING || process.env.MONGO_URI || process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};



const updateSlugs = async () => {
    await connectDB();
    
    try {
        const packages = await Package.find({});
        console.log(`Found ${packages.length} packages.`);

        for (const pkg of packages) {
            // Trigger pre-save hook by just saving
            // The hook checks if (this.isModified('name') || !this.slug)
            
            // If we want to force regen, we can clear the slug first
            if (!pkg.slug) {
                console.log(`Updating slug for: ${pkg.name}`);
                await pkg.save();
            } else {
                console.log(`Skipping ${pkg.name}, slug exists: ${pkg.slug}`);
            }
        }
        
        console.log('Migration completed.');
        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

updateSlugs();
