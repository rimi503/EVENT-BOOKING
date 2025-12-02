const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
require('dotenv').config();

// 👇 YAHAN APNA NAYA PASSWORD LIKHEIN
const NEW_PASSWORD = "admin123"; 
const ADMIN_EMAIL = "admin@gmail.com"; // Jo email aap use kar rahe hain

const resetPassword = async () => {
    try {
        const dbLink = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eventPartyDB";
        await mongoose.connect(dbLink);
        console.log("✅ DB Connected");

        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
        
        // Update or Create Admin
        const admin = await Admin.findOneAndUpdate(
            { email: ADMIN_EMAIL },
            { 
                email: ADMIN_EMAIL, 
                password: hashedPassword, 
                username: "SuperAdmin" 
            },
            { new: true, upsert: true } // Agar nahi hai to bana dega, hai to update karega
        );

        console.log(`🎉 Success! Email: ${ADMIN_EMAIL} | Password: ${NEW_PASSWORD}`);
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

resetPassword();