const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

// Middleware
app.use(express.json()); // for parsing application/json
app.use(express.static(path.join(__dirname, '/'))); // Serve static files

// API Endpoints

// GET all bookings
app.get('/api/bookings', async (req, res) => {
    try {
        const data = await fs.readFile(BOOKINGS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        // If the file doesn't exist, return an empty array
        if (error.code === 'ENOENT') {
            return res.json([]);
        }
        res.status(500).send('Server error');
    }
});

// POST a new booking
app.post('/api/bookings', async (req, res) => {
    const { name, email, selected_time } = req.body;

    if (!name || !email || !selected_time) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const newBooking = { name, email, selected_time, id: Date.now() };

    try {
        let bookings = [];
        try {
            const data = await fs.readFile(BOOKINGS_FILE, 'utf8');
            bookings = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist, we start with an empty array
            if (error.code !== 'ENOENT') throw error;
        }

        // Check for conflicts
        const isSlotTaken = bookings.some(booking => booking.selected_time === newBooking.selected_time);
        if (isSlotTaken) {
            return res.status(409).json({ message: 'This time slot is no longer available. Please select another time.' });
        }

        bookings.push(newBooking);

        await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
        
        res.status(201).json(newBooking);

    } catch (error) {
        res.status(500).send('Server error while saving booking.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('To start the server, run: node server.js');
});
