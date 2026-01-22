require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const { stringify } = require('csv-stringify/sync');
const moment = require('moment');

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
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Session-Id', 'Wifi-Network']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de CORS para debug
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('CORS Preflight:', {
      origin: req.headers.origin,
      method: req.headers['access-control-request-method'],
      headers: req.headers['access-control-request-headers']
    });
  }
  next();
});

// Servir archivos estáticos del panel admin
app.use('/admin', express.static(path.join(__dirname, '.')));
app.use('/static', express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wifi-portal';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => {
  console.error('❌ Error conectando a MongoDB:', err.message);
  console.log('⚠️  Usando almacenamiento en memoria temporal...');
});

// ========== ESQUEMA MEJORADO DE USUARIO ==========
const userSchema = new mongoose.Schema({
  // Información básica (capturada en el portal)
  fullName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un email válido']
  },
  
  // Redes sociales (conexión mejorada)
  facebook: { type: String, trim: true, default: '' },
  instagram: { type: String, trim: true, default: '' },
  twitter: { type: String, trim: true, default: '' },
  linkedin: { type: String, trim: true, default: '' },
  whatsappNumber: { type: String, trim: true, default: '' },
  
  // Información técnica
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
  lastAccess: { type: Date, default: Date.now },
  
  // ========== NUEVOS CAMPOS PARA SEGUIMIENTO ==========
  // Información para reintegración laboral
  migrationStatus: {
    type: String,
    enum: ['retornado', 'en_transito', 'establecido', 'busca_empleo', 'empleado', 'no_aplica'],
    default: 'retornado'
  },
  
  employmentInterest: [{
    type: String,
    enum: ['agricultura', 'construccion', 'manufactura', 'servicios', 'comercio', 'tecnologia', 'administrativo', 'limpieza', 'seguridad', 'salud', 'educacion', 'otros']
  }],
  
  skills: [String],
  
  hasDocuments: {
    type: Boolean,
    default: false
  },
  
  needsSupport: {
    type: String,
    enum: ['documentacion', 'vivienda', 'salud', 'educacion', 'empleo', 'asistencia_legal', 'apoyo_psicologico', 'ninguno'],
    default: 'empleo'
  },
  
  contactPreference: {
    type: [String],
    enum: ['whatsapp', 'facebook', 'instagram', 'email', 'llamada', 'sms', 'mensaje_app'],
    default: ['whatsapp']
  },
  
  preferredContactTime: {
    type: String,
    enum: ['manana', 'tarde', 'noche', 'cualquier_hora'],
    default: 'tarde'
  },
  
  location: {
    department: String,
    municipality: String,
    community: String
  },
  
  familyMembers: {
    type: Number,
    min: 0,
    default: 0
  },
  
  // Seguimiento de contactos
  lastContactAttempt: Date,
  contactAttempts: {
    type: Number,
    default: 0
  },
  contactSuccess: {
    type: Boolean,
    default: false
  },
  
  notes: String,
  
  // Historial de comunicación
  communicationHistory: [{
    date: { type: Date, default: Date.now },
    channel: String,
    message: String,
    response: String,
    agent: String,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'responded', 'failed'],
      default: 'sent'
    }
  }],
  
  // Referencia a oportunidades laborales
  jobOpportunities: [{
    jobId: mongoose.Schema.Types.ObjectId,
    applied: Date,
    status: {
      type: String,
      enum: ['applied', 'interview', 'hired', 'rejected'],
      default: 'applied'
    },
    notes: String
  }],
  
  // Consentimiento y privacidad
  consentGiven: {
    type: Boolean,
    default: true
  },
  
  consentDate: {
    type: Date,
    default: Date.now
  },
  
  privacyLevel: {
    type: String,
    enum: ['basic', 'standard', 'full'],
    default: 'standard'
  }
  
}, {
  timestamps: true
});

// Índices para mejor rendimiento
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ accessDate: -1 });
userSchema.index({ status: 1 });
userSchema.index({ migrationStatus: 1 });
userSchema.index({ 'employmentInterest': 1 });
userSchema.index({ 'contactPreference': 1 });

const User = mongoose.model('User', userSchema);

// Almacenamiento en memoria si MongoDB falla
let memoryStore = [];

// ========== FUNCIONES AUXILIARES ==========
function generateAccessCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WIFI-${code}`;
}

function validateGuatemalanPhone(phone) {
  // Validación básica para números guatemaltecos
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 8 && cleaned.length <= 12;
}

function extractSocialProfile(url, platform) {
  // Extraer nombre de usuario de URL de red social
  if (!url) return '';
  
  const patterns = {
    facebook: /(?:facebook\.com\/|fb\.me\/|@)?([\w\.]+)/i,
    instagram: /(?:instagram\.com\/|@)?([\w\.]+)/i,
    twitter: /(?:twitter\.com\/|@)?([\w\.]+)/i,
    linkedin: /linkedin\.com\/in\/([\w\-]+)/i
  };
  
  const match = url.match(patterns[platform]);
  return match ? match[1] : url;
}

// ========== RUTAS ==========

// Ruta de health check
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    memoryStore: memoryStore.length,
    service: 'Portal WiFi - Apoyo Migrantes Retornados',
    version: '2.0.0'
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API Portal WiFi Cautivo - Apoyo a Migrantes Retornados',
    version: '2.0.0',
    status: 'operational',
    endpoints: {
      api: '/api',
      register: '/api/register (POST)',
      users: '/api/users (GET)',
      stats: '/api/stats (GET)',
      export: '/api/export/csv (GET)',
      contact: '/api/contact/:userId (POST)',
      contactable: '/api/users/contactable (GET)',
      admin: '/admin'
    },
    documentation: 'Visita /admin para el panel de administración',
    health: '/api/health'
  });
});

// Ruta principal del API
app.get('/api/', (req, res) => {
  res.json({
    message: 'API Portal WiFi Cautivo - Apoyo a Migrantes Retornados Guatemala',
    version: '2.0.0',
    endpoints: {
      register: 'POST /api/register',
      users: 'GET /api/users',
      usersByStatus: 'GET /api/users/status/:status',
      contactable: 'GET /api/users/contactable',
      stats: 'GET /api/stats',
      export: 'GET /api/export/csv',
      exportContacts: 'GET /api/export/contacts',
      contact: 'POST /api/contact/:userId',
      update: 'PUT /api/user/:id'
    },
    purpose: 'Sistema de captura y seguimiento para migrantes retornados en Guatemala'
  });
});

// ========== REGISTRO MEJORADO ==========
app.post('/api/register', async (req, res) => {
  try {
    const { 
      fullName, 
      phone, 
      email, 
      facebook, 
      instagram, 
      twitter, 
      linkedin,
      whatsappNumber,
      // Nuevos campos para reintegración
      migrationStatus,
      employmentInterest,
      skills,
      needsSupport,
      contactPreference,
      location,
      familyMembers
    } = req.body;
    
    // Validación básica
    if (!fullName || !phone || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre, teléfono y email son requeridos' 
      });
    }
    
    // Validar número guatemalteco
    if (!validateGuatemalanPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Por favor ingrese un número de teléfono válido de Guatemala'
      });
    }
    
    const sessionId = req.headers['session-id'] || `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const accessCode = generateAccessCode();
    
    // Procesar perfiles de redes sociales
    const processedFacebook = extractSocialProfile(facebook, 'facebook');
    const processedInstagram = extractSocialProfile(instagram, 'instagram');
    const processedTwitter = extractSocialProfile(twitter, 'twitter');
    const processedLinkedin = extractSocialProfile(linkedin, 'linkedin');
    
    const userData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      facebook: processedFacebook,
      instagram: processedInstagram,
      twitter: processedTwitter,
      linkedin: processedLinkedin,
      whatsappNumber: whatsappNumber ? whatsappNumber.trim() : '',
      ipAddress: req.ip || req.connection.remoteAddress,
      deviceInfo: JSON.stringify({
        userAgent: req.headers['user-agent'] || '',
        acceptLanguage: req.headers['accept-language'] || '',
        platform: req.headers['sec-ch-ua-platform'] || 'unknown'
      }),
      sessionId,
      accessCode,
      wifiNetwork: req.headers['wifi-network'] || 'WiFi-Gratis - Apoyo Migrantes',
      lastAccess: new Date(),
      
      // Nuevos campos
      migrationStatus: migrationStatus || 'retornado',
      employmentInterest: employmentInterest || ['construccion', 'servicios', 'agricultura'],
      skills: skills ? (Array.isArray(skills) ? skills : [skills]) : [],
      needsSupport: needsSupport || 'empleo',
      contactPreference: contactPreference || ['whatsapp', 'llamada'],
      location: location || {},
      familyMembers: familyMembers || 0,
      
      // Información por defecto para Guatemala
      ...(location ? {} : {
        location: {
          department: 'Guatemala',
          municipality: 'Ciudad de Guatemala'
        }
      })
    };
    
    let savedUser;
    
    // Intentar guardar en MongoDB
    if (mongoose.connection.readyState === 1) {
      const user = new User(userData);
      savedUser = await user.save();
      console.log(`✅ Usuario registrado: ${email} - ${fullName}`);
    } else {
      // Fallback a memoria
      userData.id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      userData.createdAt = new Date();
      memoryStore.push(userData);
      savedUser = userData;
      console.log(`⚠️  Usuario guardado en memoria: ${email}`);
    }
    
    // Preparar respuesta mejorada
    const response = {
      success: true,
      message: '¡Registro exitoso! Ya tienes acceso a Internet. Te contactaremos pronto con oportunidades laborales.',
      data: {
        accessCode,
        userId: savedUser._id || savedUser.id,
        fullName: savedUser.fullName,
        expiresIn: '24 horas',
        contactInfo: {
          canContact: true,
          channels: savedUser.contactPreference || ['whatsapp'],
          nextContact: 'En los próximos 3 días hábiles'
        }
      },
      resources: {
        employment: 'https://www.mintrabajo.gob.gt/',
        migration: 'https://www.igm.gob.gt/',
        support: 'https://www.conamigua.gob.gt/'
      },
      redirectUrl: process.env.FRONTEND_REDIRECT || 'https://www.google.com',
      countdown: 5
    };
    
    res.status(201).json(response);
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor',
      suggestion: 'Por favor intente nuevamente o contacte al administrador'
    });
  }
});

// ========== OBTENER USUARIOS ==========
app.get('/api/users', async (req, res) => {
  try {
    const { status, migrationStatus, limit = 100, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    let users;
    let total;
    
    if (mongoose.connection.readyState === 1) {
      const query = {};
      if (status) query.status = status;
      if (migrationStatus) query.migrationStatus = migrationStatus;
      
      users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v -deviceInfo');
      
      total = await User.countDocuments(query);
    } else {
      let filtered = memoryStore;
      if (status) filtered = filtered.filter(u => u.status === status);
      if (migrationStatus) filtered = filtered.filter(u => u.migrationStatus === migrationStatus);
      
      total = filtered.length;
      users = filtered
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + parseInt(limit))
        .map(u => ({
          ...u,
          _id: u.id
        }));
    }
    
    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== OBTENER USUARIOS POR ESTADO ==========
app.get('/api/users/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ['retornado', 'en_transito', 'establecido', 'busca_empleo', 'empleado'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado no válido',
        validStatuses
      });
    }
    
    let users;
    
    if (mongoose.connection.readyState === 1) {
      users = await User.find({ migrationStatus: status })
        .sort({ createdAt: -1 })
        .select('fullName phone email migrationStatus employmentInterest skills contactPreference');
    } else {
      users = memoryStore
        .filter(u => u.migrationStatus === status)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(u => ({
          fullName: u.fullName,
          phone: u.phone,
          email: u.email,
          migrationStatus: u.migrationStatus,
          employmentInterest: u.employmentInterest,
          skills: u.skills,
          contactPreference: u.contactPreference
        }));
    }
    
    res.json({
      success: true,
      count: users.length,
      status,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== USUARIOS CONTACTABLES ==========
app.get('/api/users/contactable', async (req, res) => {
  try {
    const { channel, department, lastContactDays } = req.query;
    
    let users;
    
    if (mongoose.connection.readyState === 1) {
      const query = {
        $or: [
          { 'contactPreference': { $exists: true, $ne: [] } },
          { phone: { $exists: true, $ne: '' } },
          { email: { $exists: true, $ne: '' } }
        ],
        status: 'active'
      };
      
      if (channel) {
        query.contactPreference = channel;
      }
      
      if (department) {
        query['location.department'] = department;
      }
      
      if (lastContactDays) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(lastContactDays));
        query.lastContactAttempt = { $lt: daysAgo };
      }
      
      users = await User.find(query)
        .sort({ lastContactAttempt: 1, createdAt: -1 })
        .select('fullName phone email contactPreference facebook instagram whatsappNumber migrationStatus employmentInterest lastContactAttempt contactAttempts location');
    } else {
      users = memoryStore.filter(u => 
        (u.phone || u.email || (u.contactPreference && u.contactPreference.length > 0)) &&
        u.status === 'active'
      ).map(u => ({
        fullName: u.fullName,
        phone: u.phone,
        email: u.email,
        contactPreference: u.contactPreference || [],
        facebook: u.facebook,
        instagram: u.instagram,
        whatsappNumber: u.whatsappNumber,
        migrationStatus: u.migrationStatus,
        employmentInterest: u.employmentInterest,
        lastContactAttempt: u.lastContactAttempt,
        contactAttempts: u.contactAttempts || 0,
        location: u.location || {}
      }));
      
      if (channel) {
        users = users.filter(u => 
          u.contactPreference && u.contactPreference.includes(channel)
        );
      }
      
      if (department) {
        users = users.filter(u => 
          u.location && u.location.department === department
        );
      }
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

// ========== CONTACTAR USUARIO ==========
app.post('/api/contact/:userId', async (req, res) => {
  try {
    const { channel, message, agent, template } = req.body;
    const { userId } = req.params;
    
    // Validar canal
    const validChannels = ['whatsapp', 'facebook', 'instagram', 'email', 'llamada', 'sms'];
    if (!validChannels.includes(channel)) {
      return res.status(400).json({
        success: false,
        error: 'Canal no válido',
        validChannels
      });
    }
    
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findById(userId);
    } else {
      user = memoryStore.find(u => u.id === userId || u._id === userId);
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }
    
    // Plantillas de mensaje para Guatemala
    const templates = {
      welcome: `Hola ${user.fullName}, te damos la bienvenida de regreso a Guatemala. Somos del programa de apoyo a migrantes retornados. ¿En qué podemos ayudarte?`,
      job_opportunity: `Hola ${user.fullName}, tenemos oportunidades laborales que podrían interesarte en ${user.employmentInterest ? user.employmentInterest.join(', ') : 'diferentes sectores'}. ¿Te gustaría saber más?`,
      follow_up: `Hola ${user.fullName}, te contactamos para seguir tu proceso de reintegración. ¿Cómo te ha ido en la búsqueda de empleo?`,
      support: `Hola ${user.fullName}, sabemos que el retorno puede ser difícil. Ofrecemos apoyo en ${user.needsSupport || 'empleo y documentación'}. ¿Necesitas asistencia?`
    };
    
    const finalMessage = template && templates[template] 
      ? templates[template].replace('[nombre]', user.fullName)
      : message || templates.welcome;
    
    // Registro de contacto
    const contactRecord = {
      date: new Date(),
      channel,
      message: finalMessage,
      agent: agent || 'sistema_apoyo_migrantes',
      response: 'pending',
      status: 'sent'
    };
    
    if (mongoose.connection.readyState === 1) {
      await User.findByIdAndUpdate(userId, {
        $push: { communicationHistory: contactRecord },
        lastContactAttempt: new Date(),
        $inc: { contactAttempts: 1 }
      });
    } else {
      // Manejo en memoria
      user.communicationHistory = user.communicationHistory || [];
      user.communicationHistory.push(contactRecord);
      user.lastContactAttempt = new Date();
      user.contactAttempts = (user.contactAttempts || 0) + 1;
    }
    
    // Aquí se integraría con APIs reales:
    // - Twilio para WhatsApp/SMS
    // - Facebook Graph API para Messenger
    // - nodemailer para email
    
    res.json({
      success: true,
      message: `Mensaje preparado para enviar por ${channel}`,
      data: {
        user: {
          name: user.fullName,
          phone: user.phone,
          email: user.email,
          preferredChannels: user.contactPreference
        },
        contact: contactRecord,
        nextSteps: `El mensaje será enviado en el próximo lote de contactos.`,
        estimatedDelivery: 'En menos de 1 hora'
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ESTADÍSTICAS MEJORADAS ==========
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
          { linkedin: { $ne: '' } },
          { whatsappNumber: { $ne: '' } }
        ]
      });
      
      // Estadísticas por estado migratorio
      const migrationStats = await User.aggregate([
        { $group: { _id: '$migrationStatus', count: { $sum: 1 } } }
      ]);
      
      // Estadísticas por departamento
      const locationStats = await User.aggregate([
        { $match: { 'location.department': { $exists: true, $ne: '' } } },
        { $group: { _id: '$location.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Contactos exitosos
      const contactedUsers = await User.countDocuments({ contactAttempts: { $gt: 0 } });
      const successfulContacts = await User.countDocuments({ contactSuccess: true });
      
      stats = { 
        totalUsers, 
        todayUsers, 
        withSocial,
        migrationStats: migrationStats.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        locationStats,
        contactStats: {
          contacted: contactedUsers,
          successful: successfulContacts,
          rate: totalUsers > 0 ? (successfulContacts / totalUsers * 100).toFixed(1) : 0
        }
      };
    } else {
      const today = new Date().toDateString();
      const todayUsers = memoryStore.filter(u => 
        new Date(u.createdAt).toDateString() === today
      ).length;
      
      const withSocial = memoryStore.filter(u => 
        u.facebook || u.instagram || u.twitter || u.linkedin || u.whatsappNumber
      ).length;
      
      // Estadísticas básicas en memoria
      const migrationStats = {};
      memoryStore.forEach(u => {
        const status = u.migrationStatus || 'retornado';
        migrationStats[status] = (migrationStats[status] || 0) + 1;
      });
      
      stats = {
        totalUsers: memoryStore.length,
        todayUsers,
        withSocial,
        migrationStats,
        locationStats: [],
        contactStats: {
          contacted: memoryStore.filter(u => u.contactAttempts > 0).length,
          successful: memoryStore.filter(u => u.contactSuccess).length,
          rate: memoryStore.length > 0 ? 
            (memoryStore.filter(u => u.contactSuccess).length / memoryStore.length * 100).toFixed(1) : 0
        }
      };
    }
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      generatedAt: moment().format('DD/MM/YYYY HH:mm:ss')
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== EXPORTACIÓN MEJORADA ==========
app.get('/api/export/csv', async (req, res) => {
  try {
    let users;
    
    if (mongoose.connection.readyState === 1) {
      users = await User.find().sort({ createdAt: -1 });
    } else {
      users = memoryStore;
    }
    
    // Cabeceras mejoradas
    const headers = [
      'ID', 'Nombre Completo', 'Teléfono', 'Email', 
      'Facebook', 'Instagram', 'Twitter', 'LinkedIn', 'WhatsApp',
      'Estado Migratorio', 'Interés Laboral', 'Habilidades',
      'Necesita Apoyo', 'Preferencia Contacto', 'Departamento',
      'Municipio', 'Miembros Familia', 'Fecha Registro',
      'Último Contacto', 'Intentos Contacto', 'Contacto Exitoso',
      'Código Acceso', 'Red WiFi'
    ];
    
    const rows = users.map(user => [
      user._id || user.id || 'N/A',
      `"${user.fullName}"`,
      `"${user.phone}"`,
      `"${user.email}"`,
      `"${user.facebook || ''}"`,
      `"${user.instagram || ''}"`,
      `"${user.twitter || ''}"`,
      `"${user.linkedin || ''}"`,
      `"${user.whatsappNumber || ''}"`,
      `"${user.migrationStatus || 'retornado'}"`,
      `"${(user.employmentInterest || []).join(', ')}"`,
      `"${(user.skills || []).join(', ')}"`,
      `"${user.needsSupport || 'empleo'}"`,
      `"${(user.contactPreference || []).join(', ')}"`,
      `"${user.location?.department || ''}"`,
      `"${user.location?.municipality || ''}"`,
      user.familyMembers || 0,
      `"${new Date(user.createdAt || user.accessDate).toLocaleString('es-GT')}"`,
      `"${user.lastContactAttempt ? new Date(user.lastContactAttempt).toLocaleString('es-GT') : 'No contactado'}"`,
      user.contactAttempts || 0,
      user.contactSuccess ? 'Sí' : 'No',
      `"${user.accessCode || 'N/A'}"`,
      `"${user.wifiNetwork || 'WiFi-Gratis'}"`
    ]);
    
    const csv = stringify([headers, ...rows]);
    
    const filename = `usuarios_migrantes_${moment().format('YYYY-MM-DD_HH-mm')}.csv`;
    
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv); // BOM para Excel
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Exportación específica para contactos
app.get('/api/export/contacts', async (req, res) => {
  try {
    const { channel } = req.query;
    
    let users;
    
    if (mongoose.connection.readyState === 1) {
      const query = { status: 'active' };
      if (channel) {
        query.contactPreference = channel;
      }
      
      users = await User.find(query)
        .sort({ migrationStatus: 1, createdAt: -1 })
        .select('fullName phone email whatsappNumber facebook instagram migrationStatus employmentInterest contactPreference');
    } else {
      users = memoryStore
        .filter(u => u.status === 'active')
        .filter(u => !channel || (u.contactPreference && u.contactPreference.includes(channel)))
        .map(u => ({
          fullName: u.fullName,
          phone: u.phone,
          email: u.email,
          whatsappNumber: u.whatsappNumber,
          facebook: u.facebook,
          instagram: u.instagram,
          migrationStatus: u.migrationStatus,
          employmentInterest: u.employmentInterest,
          contactPreference: u.contactPreference
        }));
    }
    
    const headers = ['Nombre', 'Teléfono', 'WhatsApp', 'Email', 'Facebook', 'Instagram', 'Estado', 'Interés Laboral', 'Preferencia Contacto'];
    
    const rows = users.map(user => [
      `"${user.fullName}"`,
      `"${user.phone}"`,
      `"${user.whatsappNumber || ''}"`,
      `"${user.email}"`,
      `"${user.facebook || ''}"`,
      `"${user.instagram || ''}"`,
      `"${user.migrationStatus}"`,
      `"${(user.employmentInterest || []).join(', ')}"`,
      `"${(user.contactPreference || []).join(', ')}"`
    ]);
    
    const csv = stringify([headers, ...rows]);
    
    const filename = `contactos_${channel || 'todos'}_${moment().format('YYYY-MM-DD')}.csv`;
    
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.header('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csv);
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== ACTUALIZAR USUARIO ==========
app.put('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    let updatedUser;
    
    if (mongoose.connection.readyState === 1) {
      updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-__v -deviceInfo');
      
      if (!updatedUser) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }
    } else {
      const userIndex = memoryStore.findIndex(u => u.id === id || u._id === id);
      
      if (userIndex === -1) {
        return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      }
      
      memoryStore[userIndex] = {
        ...memoryStore[userIndex],
        ...updateData,
        updatedAt: new Date()
      };
      
      updatedUser = memoryStore[userIndex];
    }
    
    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: updatedUser
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== RUTAS ADMIN ==========
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Ruta para dashboard de estadísticas
app.get('/admin/stats', (req, res) => {
  res.json({
    message: 'Dashboard de estadísticas - Panel de administración',
    available: true
  });
});

// ========== MANEJO DE ERRORES ==========
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
      usersByStatus: 'GET /api/users/status/:status',
      contactable: 'GET /api/users/contactable',
      stats: 'GET /api/stats',
      exportCSV: 'GET /api/export/csv',
      exportContacts: 'GET /api/export/contacts',
      contact: 'POST /api/contact/:userId',
      updateUser: 'PUT /api/user/:id',
      health: 'GET /api/health',
      admin: 'GET /admin'
    }
  });
});

app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    support: 'contacto@apoyomigrantesgt.org'
  });
});

// ========== INICIAR SERVIDOR ==========
const server = app.listen(PORT, () => {
  console.log(`
=============================================
🚀 Servidor iniciado en puerto ${PORT}
📊 Panel admin: http://localhost:${PORT}/admin
🌐 API: http://localhost:${PORT}/api
🔧 Entorno: ${process.env.NODE_ENV || 'development'}
📅 Fecha: ${new Date().toLocaleString('es-GT')}
=============================================
  `);
});

// Graceful shutdown
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