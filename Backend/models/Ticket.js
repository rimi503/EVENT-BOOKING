const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketId: { type: String, required: true, unique: true },
    
    // 1. Main Booker Details
    mainGuest: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        surname: { type: String, default: '' },
        phone: { type: String, required: true },
        email: { type: String, required: true }
    },

    // 2. Other Members (Name + Phone Number Required)
    members: [{
        name: { type: String, required: true },
        phone: { type: String, required: true }
    }],

    // 3. Payment Details
    totalAmount: { type: Number, required: true },
    transactionId: { type: String, default: '' }, // UTR
    
    // 4. Status Flow
    paymentStatus: { 
        type: String, 
        enum: ['INITIATED', 'VERIFICATION_PENDING', 'PAID', 'REJECTED'], 
        default: 'INITIATED' 
    },
    
    rejectionReason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', ticketSchema);