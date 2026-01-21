// Prueba SUPER simple
console.log('🧪 Probando instalación de módulos...');

try {
  require('express');
  console.log('✅ Express cargado');
} catch(e) {
  console.log('❌ Express NO instalado');
}

try {
  require('mongoose');
  console.log('✅ Mongoose cargado');
} catch(e) {
  console.log('❌ Mongoose NO instalado:', e.message);
}

try {
  require('dotenv');
  console.log('✅ Dotenv cargado');
} catch(e) {
  console.log('❌ Dotenv NO instalado');
}

console.log('\n📦 Módulos instalados en node_modules:');
const fs = require('fs');
if (fs.existsSync('node_modules')) {
  const modules = fs.readdirSync('node_modules');
  console.log('Total módulos:', modules.length);
  console.log('Algunos módulos:', modules.slice(0, 10).join(', '));
} else {
  console.log('❌ NO existe node_modules/');
  console.log('Ejecuta: npm install');
}