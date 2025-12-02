const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_party_key_2025";

// 1. LOGIN ROUTE
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if Admin Exists
        const admin = await Admin.findOne({ email });
        if (!admin) {
            // 401 = Unauthorized (Better than 400 for login fail)
            return res.status(401).json({ success: false, message: "Email not registered" });
        }

        // Check Password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Incorrect Password" });
        }

        // Create Token
        const token = jwt.sign({ id: admin._id, username: admin.username }, JWT_SECRET, { expiresIn: '1d' });

        // Set Secure Cookie
        res.cookie('adminToken', token, {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production', // Localhost pe false rahega
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 1 Day
        });

        res.json({ success: true, username: admin.username, message: "Login Successful!" });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 2. LOGOUT
router.post('/logout', (req, res) => {
    res.clearCookie('adminToken');
    res.json({ success: true, message: "Logged out" });
});

// 3. CHECK SESSION (Navbar ke liye)
router.get('/check', (req, res) => {
    const token = req.cookies.adminToken;
    if (!token) return res.json({ isAdmin: false });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        res.json({ isAdmin: true, user: verified });
    } catch (err) {
        res.clearCookie('adminToken');
        res.json({ isAdmin: false });
    }
});

// 4. CHANGE PASSWORD
router.post('/change-password', async (req, res) => {
    const token = req.cookies.adminToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        const { newPassword } = req.body;

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password too short (min 6 chars)" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await Admin.findByIdAndUpdate(verified.id, { password: hashedPassword });

        res.json({ success: true, message: "Password Updated" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating password" });
    }
});

module.exports = router;