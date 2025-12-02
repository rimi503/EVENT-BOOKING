const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { v4: uuidv4 } = require('uuid');

// 💰 OWNER SETTING: Price Per Person
const PRICE_PER_HEAD = 1000; 

// 1. INITIATE BOOKING (Calculate Amount Server-Side)
router.post('/initiate-booking', async (req, res) => {
    try {
        const { mainGuest, members } = req.body;
        
        if (members.length > 4) return res.status(400).json({ message: "Max 5 members allowed." });

        // Calculate Total
        const totalPax = 1 + members.length;
        const totalAmount = totalPax * PRICE_PER_HEAD;
        const ticketId = uuidv4().slice(0, 8).toUpperCase();

        const newTicket = new Ticket({
            ticketId,
            mainGuest,
            members,
            totalAmount,
            paymentStatus: 'INITIATED'
        });

        await newTicket.save();
        res.json({ success: true, ticketId, totalAmount, message: "Booking Started" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// 2. VERIFY PAYMENT
router.post('/confirm-payment', async (req, res) => {
    try {
        const { ticketId, transactionId } = req.body;
        
        // Basic Validation
        if(!transactionId || transactionId.length < 10) {
            return res.status(400).json({ success: false, message: "Invalid Transaction ID" });
        }

        // Check for Duplicate UTR
        const duplicate = await Ticket.findOne({ transactionId, ticketId: { $ne: ticketId } });
        if(duplicate) {
            return res.status(400).json({ success: false, message: "UTR already used." });
        }

        const ticket = await Ticket.findOne({ ticketId });
        if (!ticket) return res.status(404).json({ success: false, message: "Ticket not found" });

        ticket.transactionId = transactionId;
        ticket.paymentStatus = 'VERIFICATION_PENDING';
        ticket.rejectionReason = ""; 
        await ticket.save();

        res.json({ success: true, ticket });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error updating payment" });
    }
});

// 3. ADMIN: FETCH ALL (Sorted Newest First)
router.get('/all-tickets', async (req, res) => {
    try {
        const tickets = await Ticket.find().sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 4. ADMIN: UPDATE STATUS
router.post('/update-status', async (req, res) => {
    try {
        const { ticketId, status, reason } = req.body;
        const updateData = { paymentStatus: status };
        if (status === 'REJECTED') updateData.rejectionReason = reason;

        await Ticket.findOneAndUpdate({ ticketId }, updateData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
});

// 5. USER: CHECK STATUS
router.get('/status/:ticketId', async (req, res) => {
    try {
        const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
        if (!ticket) return res.status(404).json({ message: "Not found" });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: "Error" });
    }
});

// 6. RECOVERY (Find My Ticket)
router.post('/find-ticket', async (req, res) => {
    try {
        const { search } = req.body;
        // Search by Phone OR Transaction ID OR Ticket ID
        const ticket = await Ticket.findOne({
            $or: [
                { 'mainGuest.phone': search },
                { transactionId: search },
                { ticketId: search }
            ]
        });

        if(ticket) res.json({ success: true, ticket });
        else res.status(404).json({ success: false, message: "No booking found." });
    } catch(e) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

module.exports = router;