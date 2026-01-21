const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conectar a MongoDB (gratis en MongoDB Atlas para demo)
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wifi-portal', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Modelo de Usuario
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    facebook: String,
    instagram: String,
    twitter: String,
    linkedin: String,
    macAddress: String,
    ipAddress: String,
    accessDate: { type: Date, default: Date.now },
    sessionId: String,
    wifiNetwork: String,
    status: { type: String, default: 'pending' }
});

const User = mongoose.model('User', userSchema);

// Rutas
app.post('/api/register', async (req, res) => {
    try {
        const userData = {
            ...req.body,
            sessionId: req.headers['session-id'] || Date.now().toString(),
            ipAddress: req.ip
        };

        const user = new User(userData);
        await user.save();
        
        res.status(201).json({
            success: true,
            message: 'Registro exitoso',
            accessCode: generateAccessCode(),
            userId: user._id
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ accessDate: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/user/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function generateAccessCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});