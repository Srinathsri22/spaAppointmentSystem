const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_PATH = 'appointments.txt';

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (like HTML)

// Load appointments from file
function loadAppointmentsFromFile() {
    if (fs.existsSync(FILE_PATH)) {
        const data = fs.readFileSync(FILE_PATH, 'utf-8');
        return JSON.parse(data);
    }
    return [];
}

// Save appointments to file
function saveAppointmentsToFile(appointments) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(appointments, null, 2));
}

// Load initial appointments
let appointments = loadAppointmentsFromFile();

// Routes

// Serve the booking page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Booking: Create or update an appointment
app.post('/submit-booking', (req, res) => {
    const { name, email, phone, service, time, date, notes } = req.body;

    if (!name || !email || !phone || !service || !time || !date) {
        return res.status(400).send('All fields (name, email, phone, service, time, date) are required.');
    }

    const index = appointments.findIndex(appointment => appointment.phone === phone);
    if (index !== -1) {
        appointments[index] = { name, email, phone, service, time, date, notes };
        saveAppointmentsToFile(appointments);
        return res.send(`Appointment for ${name} updated successfully.`);
    }

    appointments.push({ name, email, phone, service, time, date, notes });
    saveAppointmentsToFile(appointments);
    res.status(201).send(`Appointment for ${name} booked successfully.`);
});

// Modify an appointment
app.post('/modify-appointment', (req, res) => {
    const { phone, service, time, date, notes } = req.body;

    if (!phone || (!service && !time && !date && !notes)) {
        return res.status(400).send('Phone number and at least one field to update are required.');
    }

    const appointment = appointments.find(appointment => appointment.phone === phone);
    if (!appointment) {
        return res.status(404).send('Appointment not found.');
    }

    if (service) appointment.service = service;
    if (time) appointment.time = time;
    if (date) appointment.date = date;
    if (notes) appointment.notes = notes;

    saveAppointmentsToFile(appointments);
    res.send(`Appointment for phone number ${phone} updated successfully.`);
});

// Cancel an appointment
app.post('/cancel-appointment', (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).send('<h1>Error</h1><p>Phone number is required to cancel an appointment.</p>');
    }

    const index = appointments.findIndex(appointment => appointment.phone === phone);
    if (index === -1) {
        return res.status(404).send('<h1>Error</h1><p>Appointment not found for the provided phone number.</p>');
    }

    const cancelledAppointment = appointments.splice(index, 1)[0];
    saveAppointmentsToFile(appointments);

    res.send(`<h1>Success</h1><p>Successfully cancelled appointment for ${cancelledAppointment.name}, Phone: ${cancelledAppointment.phone}.</p>`);
});


// Error Handling: Return appropriate messages for invalid routes
app.use((req, res) => {
    res.status(404).send('The requested resource was not found.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
