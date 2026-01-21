const mongoose = require('mongoose');
require('dotenv').config();

// Usa tu connection string real de MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wifi-portal';

async function testConnection() {
  console.log('🔍 Probando conexión a MongoDB...');
  console.log('📝 URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Oculta password

  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('✅ Conexión a MongoDB exitosa!');
    
    // Crear un esquema de prueba
    const testSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('TestConnection', testSchema);
    
    // Crear y guardar documento de prueba
    const testDoc = new TestModel({ message: 'Conexión de prueba exitosa' });
    await testDoc.save();
    
    console.log('✅ Documento guardado:', testDoc);
    
    // Leer documento
    const foundDoc = await TestModel.findOne({});
    console.log('✅ Documento leído:', foundDoc);
    
    // Limpiar documento de prueba
    await TestModel.deleteMany({});
    console.log('✅ Documentos de prueba limpiados');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('💡 Soluciones posibles:');
    console.log('1. Verifica tu connection string en .env');
    console.log('2. Asegúrate de tener acceso a internet');
    console.log('3. Verifica que tu IP esté en la whitelist de MongoDB Atlas');
    console.log('4. Usa 0.0.0.0/0 en Network Access de MongoDB Atlas');
  } finally {
    // Cerrar conexión
    await mongoose.disconnect();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar prueba
testConnection();