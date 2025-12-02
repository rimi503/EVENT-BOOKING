const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = "super_secret_party_key_2025"; // Real app me .env me rakhte hain

// 1. SIGNUP (Sirf ek baar use karna admin banane ke liye)
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Password encrypt karo
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newAdmin = new Admin({ username, email, password: hashedPassword });
        await newAdmin.save();
        
        res.json({ success: true, message: "Admin Created!" });
    } catch (error) {
        res.status(500).json({ error: "Error creating admin" });
    }
});

// 2. LOGIN (Token milega)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await Admin.findOne({ email });

        if (!admin) return res.status(400).json({ error: "Admin not found" });

        // Password check
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ error: "Wrong Password" });

        // Token generate karo
        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ success: true, token, username: admin.username });
    } catch (error) {
        res.status(500).json({ error: "Server Error" });
    }
});

module.exports = router;