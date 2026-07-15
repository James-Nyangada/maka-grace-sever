require('dotenv').config({ path: './.env' });
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

const checkSlugs = async () => {
    await connectDB();
    
    try {
        const pkg = await Package.findOne({});
        console.log('Sample Package:', JSON.stringify(pkg, null, 2));
        
        const count = await Package.countDocuments({ slug: { $exists: true } });
        console.log(`Packages with slugs: ${count}`);
        
        process.exit();
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

checkSlugs();
