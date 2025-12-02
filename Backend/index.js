const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cluster = require('cluster');
const os = require('os');
require('dotenv').config();

const ticketRoutes = require('./routes/ticketRoutes');
const authRoutes = require('./routes/authRoutes');
const rateLimit = require('express-rate-limit');

const totalCPUs = os.cpus().length; // Check karo server me kitne CPU hain

// --- CLUSTER LOGIC ---
if (cluster.isMaster) {
    console.log(`🚀 Master Process ${process.pid} is running`);
    console.log(`🔥 Forking for ${totalCPUs} CPUs...`);

    // Jitne CPU, utne workers banao
    for (let i = 0; i < totalCPUs; i++) {
        cluster.fork();
    }

    // Agar koi worker mar jaye (crash), to naya bana do
    cluster.on('exit', (worker, code, signal) => {
        console.log(`❌ Worker ${worker.process.pid} died. Starting a new one...`);
        cluster.fork();
    });

} else {
    // --- WORKER PROCESS (Asli Server Code Yahan Hai) ---
    const app = express();

    app.use(cors());
    app.use(express.json());

    // Database Connection
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log(`✅ DB Connected (Worker ${process.pid})`))
        .catch(err => console.log('❌ DB Error:', err));

        // Rule: 1 IP se 15 minute me max 100 requests
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: "Too many requests, please try again later."
})
    // Routes
    app.use('/api', limiter);
    app.use('/api/tickets', ticketRoutes);
    app.use('/api/auth', authRoutes);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`⚡ Server running on Worker ${process.pid}`);
    });
}