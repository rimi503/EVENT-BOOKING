const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // 👈 NEW
require('dotenv').config();

const ticketRoutes = require('./routes/ticketRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

// 👇 CORS CONFIGURATION (Very Important for Cookies)
app.use(cors({
    origin: 'http://localhost:5173', // Frontend ka EXACT URL
    credentials: true // 👈 Ye zaroori hai cookie bhejne ke liye
}));

app.use(express.json());
app.use(cookieParser()); // 👈 Cookie parser middleware

// ... Database Connection (Same as before) ...
const dbLink = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/eventPartyDB";
mongoose.connect(dbLink)
    .then(() => console.log('✅ DB Connected'))
    .catch(err => console.log('❌ DB Error:', err));

// Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/auth', authRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`⚡ Server running on port ${PORT}`);
});