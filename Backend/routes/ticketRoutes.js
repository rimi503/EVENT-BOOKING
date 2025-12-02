const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { v4: uuidv4 } = require('uuid');

// 1. INITIATE BOOKING (Save Details First)
router.post('/initiate-booking', async (req, res) => {
    try {
        const { mainName, email, phone, members } = req.body;
        
        // Basic Validation
        if (!mainName || !email || !phone) {
            return res.status(400).json({ success: false, message: "Main details missing" });
        }

        // Guests Validation
        let validMembers = [];
        if (members && members.length > 0) {
            // Sirf wo guests lo jinka naam aur phone dono bhara ho
            validMembers = members.filter(m => m.name.trim() !== "" && m.phone.trim() !== "");
            
            // Limit Check (1 Main + 4 Guests = 5 Max)
            if (validMembers.length > 4) {
                return res.status(400).json({ success: false, message: "Max 5 people allowed per group!" });
            }
        }

        const uniqueTicketId = uuidv4(); 
        
        // Amount Calculation (500 per person)
        const totalMembers = validMembers.length + 1; 
        const totalAmount = totalMembers * 500; 

        const newTicket = new Ticket({
            ticketId: uniqueTicketId,
            mainName,
            email,
            phone,
            members: validMembers, 
            amount: totalAmount,
            paymentStatus: "INITIATED"
        });

        await newTicket.save();

        res.status(201).json({ 
            success: true, 
            message: "Details Saved", 
            ticketId: uniqueTicketId,
            amount: totalAmount
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. CONFIRM PAYMENT (UTR Update)
router.post('/confirm-payment', async (req, res) => {
    try {
        const { ticketId, transactionId } = req.body;
        
        // Validation
        if (!transactionId || transactionId.length < 5) {
            return res.status(400).json({ success: false, message: "Invalid UTR" });
        }

        // Duplicate Check
        const existingUTR = await Ticket.findOne({ transactionId });
        if (existingUTR) {
            return res.status(409).json({ success: false, message: "UTR Already Used" });
        }

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return res.status(404).json({ error: "Ticket not found" });

        // Update Status
        ticket.transactionId = transactionId;
        ticket.paymentStatus = "VERIFICATION_PENDING"; 
        await ticket.save();

        res.status(200).json({ success: true, message: "Payment Submitted", ticket });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. CHECK STATUS (For Live Polling on Frontend)
router.get('/status/:ticketId', async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
        if (!ticket) return res.status(404).json({ error: "Not Found" });
        
        // Sirf status return karo
        res.json({ paymentStatus: ticket.paymentStatus });
    } catch (error) {
        res.status(500).json({ error: "Error" });
    }
});

// 4. ADMIN: GET ALL TICKETS
router.get('/all-tickets', async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ error: "Error fetching tickets" });
    }
});

// 5. ADMIN: UPDATE STATUS (Approve/Reject)
router.post('/update-status', async (req, res) => {
    try {
        const { ticketId, status } = req.body;
        await Ticket.findOneAndUpdate({ ticketId }, { paymentStatus: status });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Update failed" });
    }
});

// 6. SCANNER VERIFICATION
router.post('/verify', async (req, res) => {
    try {
        const { ticketId } = req.body;
        const ticket = await Ticket.findOne({ ticketId });
        
        if (!ticket) return res.json({ success: false, message: "Invalid Ticket" });
        if (ticket.paymentStatus !== "PAID") return res.json({ success: false, message: "Payment Pending / Rejected" });
        if (ticket.isScanned) return res.json({ success: false, message: "Already Used" });
        
        // Mark as Used
        ticket.isScanned = true;
        ticket.scannedAt = new Date();
        await ticket.save();
        
        res.json({ 
            success: true, 
            message: "Entry Approved", 
            data: { 
                name: ticket.mainName, 
                members: ticket.members.map(m => m.name), 
                totalPax: ticket.members.length + 1 
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Verify Error" });
    }
});

module.exports = router;