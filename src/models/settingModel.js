const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  officeLocation: { 
    type: String, 
    default: "Nairobi, Kenya\n(office coming soon)" 
  },
  phoneNumber: { 
    type: String, 
    default: "+254 705 794 254" 
  },
  contactPerson: { 
    type: String, 
    default: "Mary Kala" 
  },
  emailAddress: { 
    type: String, 
    default: "makagraceholdings@gmail.com" 
  },
  workingHours: { 
    type: String, 
    default: "Monday – Sunday\n8:00 AM – 9:00 PM EAT" 
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
