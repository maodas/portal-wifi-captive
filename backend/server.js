require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de seguridad
app.use(helmet({
  contentSecurityPolicy: false, // Simplificado para desarrollo
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas solicitudes desde esta IP, por favor intente más tarde.'
});
app.use('/api/', limiter);

// Middleware
app.use(morgan('combined'));
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
      process.env.ALLOWED_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://localhost:3001'];
    
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true
}));

app.use((req, res, next) => {
  console.log('CORS Headers:', {
    origin: req.headers.origin,
    method: req.method,
    url: req.url,
    'access-control-request-headers': req.headers['access-control-request-headers']
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del panel admin
app.use('/admin', express.static(path.join(__dirname, '.')));
app.use('/static', express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wifi-portal';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err.message);
  console.log('⚠️  Usando almacenamiento en memoria temporal...');
});

// Esquema y modelo de Usuario
const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un email válido']
  },
  facebook: { type: String, trim: true, default: '' },
  instagram: { type: String, trim: true, default: '' },
  twitter: { type: String, trim: true, default: '' },
  linkedin: { type: String, trim: true, default: '' },
  macAddress: { type: String, trim: true, default: '' },
  ipAddress: { type: String, trim: true, default: '' },
  deviceInfo: { type: String, default: '' },
  accessDate: { type: Date, default: Date.now, index: true },
  sessionId: { type: String, required: true },
  accessCode: { type: String, required: true },
  wifiNetwork: { type: String, default: 'WiFi-Gratis' },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'completed', 'blocked'], 
    default: 'active' 
  },
  lastAccess: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

// Almacenamiento en memoria si MongoDB falla
let memoryStore = [];

// Función para generar código de acceso
function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WIFI-${code}`;
}

// Ruta de health check para Render
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    memoryStore: memoryStore.length,
    uptime: process.uptime()
  });
});

// ⭐⭐⭐ RUTA RAÍZ - ESTO ARREGLA TU ERROR ⭐⭐⭐
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Portal WiFi Cautivo',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      api: '/api',
      register: '/api/register (POST)',
      users: '/api/users (GET)',
      stats: '/api/stats (GET)',
      export: '/api/export/csv (GET)',
      admin: '/admin'
    },
    documentation: 'Visita /admin para el panel de administración',
    health: '/api/health'
  });
});

// Ruta principal del API
app.get('/api/', (req, res) => {
  res.json({
    message: 'API Portal WiFi Cautivo',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/register',
      users: 'GET /api/users',
      stats: 'GET /api/stats',
      export: 'GET /api/export/csv'
    }
  });
});

// Registrar nuevo usuario
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, phone, email, facebook, instagram, twitter, linkedin } = req.body;
    
    // Validación básica
    if (!fullName || !phone || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre, teléfono y email son requeridos' 
      });
    }
    
    const sessionId = req.headers['session-id'] || Date.now().toString();
    const accessCode = generateAccessCode();
    
    const userData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      facebook: (facebook || '').trim(),
      instagram: (instagram || '').trim(),
      twitter: (twitter || '').trim(),
      linkedin: (linkedin || '').trim(),
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceInfo: JSON.stringify({
        userAgent: req.headers['user-agent'] || '',
        acceptLanguage: req.headers['accept-language'] || ''
      }),
      sessionId,
      accessCode,
      wifiNetwork: req.headers['wifi-network'] || 'WiFi-Gratis',
      lastAccess: new Date()
    };
    
    let savedUser;
    
    // Intentar guardar en MongoDB
    if (mongoose.connection.readyState === 1) {
      const user = new User(userData);
      savedUser = await user.save();
      console.log(`✅ Usuario guardado en MongoDB: ${email}`);
    } else {
      // Fallback a memoria
      userData.id = Date.now().toString();
      userData.createdAt = new Date();
      memoryStore.push(userData);
      savedUser = userData;
      console.log(`⚠️  Usuario guardado en memoria temporal: ${email}`);
    }
    
    // Preparar respuesta
    const response = {
      success: true,
      message: '¡Registro exitoso! Ya tienes acceso a Internet',
      data: {
        accessCode,
        userId: savedUser._id || savedUser.id,
        fullName: savedUser.fullName,
        expiresIn: '24 horas'
      },
      redirectUrl: process.env.FRONTEND_REDIRECT || 'https://www.google.com',
      countdown: 5
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor'
    });
  }
});

// Obtener todos los usuarios
app.get('/api/users', async (req, res) => {
  try {
    let users;
    
    if (mongoose.connection.readyState === 1) {
      users = await User.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .select('-__v -deviceInfo');
    } else {
      users = memoryStore.slice(-100).map(u => ({
        ...u,
        _id: u.id
      }));
    }
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Estadísticas
app.get('/api/stats', async (req, res) => {
  try {
    let stats;
    
    if (mongoose.connection.readyState === 1) {
      const totalUsers = await User.countDocuments();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayUsers = await User.countDocuments({ createdAt: { $gte: today } });
      const withSocial = await User.countDocuments({
        $or: [
          { facebook: { $ne: '' } },
          { instagram: { $ne: '' } },
          { twitter: { $ne: '' } },
          { linkedin: { $ne: '' } }
        ]
      });
      
      stats = { totalUsers, todayUsers, withSocial };
    } else {
      const today = new Date().toDateString();
      const todayUsers = memoryStore.filter(u => 
        new Date(u.createdAt).toDateString() === today
      ).length;
      
      const withSocial = memoryStore.filter(u => 
        u.facebook || u.instagram || u.twitter || u.linkedin
      ).length;
      
      stats = {
        totalUsers: memoryStore.length,
        todayUsers,
        withSocial
      };
    }
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Exportar a CSV
app.get('/api/export/csv', async (req, res) => {
  try {
    let users;
    
    if (mongoose.connection.readyState === 1) {
      users = await User.find().sort({ createdAt: -1 });
    } else {
      users = memoryStore;
    }
    
    // Convertir a CSV
    const headers = ['Nombre', 'Teléfono', 'Email', 'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'Fecha', 'Código'];
    const rows = users.map(user => [
      `"${user.fullName}"`,
      `"${user.phone}"`,
      `"${user.email}"`,
      `"${user.facebook || ''}"`,
      `"${user.instagram || ''}"`,
      `"${user.twitter || ''}"`,
      `"${user.linkedin || ''}"`,
      `"${new Date(user.createdAt || user.accessDate).toLocaleString('es-ES')}"`,
      `"${user.accessCode || 'N/A'}"`
    ]);
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename=usuarios-wifi.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta específica para el panel admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Ruta para redirigir al portal
app.get('/portal', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Portal WiFi - Backend</title>
      <meta http-equiv="refresh" content="0;url=${process.env.FRONTEND_URL || 'https://wifi-portal-frontend.onrender.com'}">
    </head>
    <body>
      <p>Redirigiendo al portal WiFi... Si no redirige, <a href="${process.env.FRONTEND_URL || 'https://wifi-portal-frontend.onrender.com'}">haz click aquí</a></p>
    </body>
    </html>
  `);
});

// Middleware para errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint no encontrado',
    path: req.path,
    availableEndpoints: {
      root: 'GET /',
      api: 'GET /api',
      register: 'POST /api/register',
      users: 'GET /api/users',
      stats: 'GET /api/stats',
      export: 'GET /api/export/csv',
      admin: 'GET /admin',
      portal: 'GET /portal',
      health: 'GET /api/health'
    }
  });
});

// Middleware para errores generales
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`
🚀 Servidor iniciado en puerto ${PORT}
📊 Panel admin: http://localhost:${PORT}/admin
🌐 API: http://localhost:${PORT}/api
🔧 Entorno: ${process.env.NODE_ENV || 'development'}
  `);
});

// Manejo graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  Recibido SIGTERM. Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    mongoose.connection.close(false, () => {
      console.log('✅ Conexión a MongoDB cerrada');
      process.exit(0);
    });
  });
});