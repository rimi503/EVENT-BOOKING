const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    
    // Main Booker Details
    mainName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    
    // Guests List (Name + Phone)
    members: [{
        name: { type: String, required: true },
        phone: { type: String, required: true }
    }], 
    
    amount: { type: Number, required: true },
    transactionId: { type: String, default: "" },
    
    paymentStatus: { type: String, default: "INITIATED" },
    isScanned: { type: Boolean, default: false },
    scannedAt: { type: Date }
}, { timestamps: true });

ticketSchema.index({ transactionId: 1 });
ticketSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);