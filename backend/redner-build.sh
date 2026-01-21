#!/bin/bash
echo "🔧 Iniciando build para Render..."
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install --production

# Verificar estructura
echo "📁 Verificando estructura..."
ls -la

# Verificar que server.js existe
if [ -f "server.js" ]; then
    echo "✅ server.js encontrado"
else
    echo "❌ ERROR: server.js NO encontrado"
    exit 1
fi

# Verificar que package.json existe
if [ -f "package.json" ]; then
    echo "✅ package.json encontrado"
    # Mostrar scripts disponibles
    echo "📜 Scripts disponibles:"
    npm run
else
    echo "❌ ERROR: package.json NO encontrado"
    exit 1
fi

echo "✅ Build completado exitosamente"