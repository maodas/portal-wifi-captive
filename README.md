Portal WiFi Cautivo – Apoyo a Migrantes Retornados
Portal cautivo para brindar acceso WiFi gratuito en el Centro de Atención al Migrante (CAR – FEGUA) y capturar datos de contacto de personas retornadas, permitiendo al IGM mantener comunicación y ofrecer asistencia posterior.
📋 Tabla de Contenidos

    Descripción del Proyecto

    Estado Actual

    Características Principales

    Tecnologías Utilizadas

    Estructura del Proyecto

    Requisitos Previos

    Instalación y Despliegue Local

    Despliegue en Render (Producción)

    Variables de Entorno

    Uso del Panel de Administración

    Limitaciones y Pasos Futuros

    Contribuciones

    Licencia

🧭 Descripción del Proyecto

Este proyecto surge como una herramienta complementaria para el Instituto Guatemalteco de Migración (IGM). En el Centro de Atención al Migrante (CAR) ubicado en FEGUA, se ofrece acceso WiFi gratuito a las personas retornadas. Al conectarse, son dirigidas a un portal cautivo donde se registran con sus datos básicos (nombre, teléfono, correo) y, opcionalmente, vinculan sus redes sociales. Esta información se almacena en una base de datos MongoDB Atlas y permite al personal del IGM contactar posteriormente a los retornados para brindar asistencia en su reintegración (empleo, vivienda, documentación, etc.).

El sistema cuenta con un panel de administración donde los encargados pueden visualizar los registros, filtrarlos, exportarlos y enviar mensajes de seguimiento mediante diferentes canales (WhatsApp, llamada, email, SMS).

Actualmente el proyecto se encuentra en estado prototipo funcional (mock), listo para ser presentado y posteriormente mejorado con las integraciones necesarias para un entorno real.
🚦 Estado Actual

    ✅ Portal de registro funcional: captura nombre, teléfono, email y perfiles sociales (manual).

    ✅ Panel de administración completo: visualización, filtros, búsqueda, contacto rápido, exportaciones CSV, estadísticas.

    ✅ API REST implementada en Node.js/Express.

    ✅ Base de datos MongoDB Atlas en la nube.

    ✅ Desplegable en Render (backend) y frontend estático en GitHub Pages / Netlify (opcional).

    ❌ Registro automático con redes sociales (OAuth) pendiente.

    ❌ Integración con el hotspot WiFi pendiente (autorización de MAC address, redirección automática).

✨ Características Principales
Portal de Registro (Frontend)

    Formulario responsive con campos obligatorios (nombre, teléfono, email).

    Botones para conectar redes sociales (Facebook, Instagram, Twitter, LinkedIn, WhatsApp) – actualmente ingreso manual.

    Generación automática de código de acceso WiFi.

    Redirección a Internet tras registro exitoso.

    Validaciones en cliente y servidor.

Panel de Administración (Backend)

    Tabla de usuarios con columnas: Nombre, Contacto (teléfono/email), Redes sociales conectadas, Fecha de registro, Código de acceso, Acciones.

    Filtros por estado (activo/completado/bloqueado), fecha (hoy/semana/mes) y búsqueda en tiempo real.

    Estadísticas en tarjetas: total de usuarios, conexiones hoy, usuarios con redes sociales, tasa de crecimiento.

    Contacto rápido: seleccionar usuario, canal y mensaje (con plantillas predefinidas). Cada intento queda registrado en el historial.

    Exportaciones: CSV de todos los datos, listado de contactos, listado para WhatsApp, usuarios con redes sociales.

    Modal de detalles del usuario con información completa e historial de comunicaciones.

API REST

    POST /api/register – Registro de nuevo usuario.

    GET /api/users – Listado de usuarios (con paginación y filtros).

    GET /api/stats – Estadísticas generales.

    POST /api/contact/:userId – Registrar intento de contacto.

    GET /api/export/csv – Exportar datos a CSV.

    GET /api/export/contacts – Exportar lista de contactos filtrada.

    PUT /api/user/:id – Actualizar datos de usuario.

    GET /api/health – Health check.

🛠 Tecnologías Utilizadas
Componente	Tecnología
Frontend Portal	HTML5, CSS3, JavaScript (Vanilla)
Backend	Node.js, Express
Base de Datos	MongoDB Atlas
Panel Admin	HTML, CSS, JavaScript, Chart.js, Moment.js
Seguridad	Helmet, CORS, express-rate-limit

📦 Requisitos Previos

    Node.js (v14 o superior)

    npm o yarn

    Cuenta en MongoDB Atlas (gratuita)

    (Opcional) Cuenta en Render para despliegue

🔧 Instalación y Despliegue Local

    1.Clonar el repositorio
    
    git clone https://github.com/maodas/portal-wifi-captive.git
    cd portal-wifi-captive

    2.Configurar el backend
    cd backend
    cp .env.example .env
    # Editar .env con tus credenciales de MongoDB Atlas y otras variables
    npm install

    3.Iniciar el servidor local
    npm run dev   # o node server.js

El servidor correrá en http://localhost:3001 (o el puerto definido en .env).

Abrir el portal de registro

    Abre el archivo frontend/index.html directamente en el navegador o sírvelo con un servidor local (por ejemplo, usando Live Server de VS Code).

    Asegúrate de que la constante API_URL en el script apunte a http://localhost:3001/api.

Acceder al panel de administración

    Visita http://localhost:3001/admin en tu navegador.

☁️ Despliegue en Render (Producción)

Render permite desplegar el backend Node.js fácilmente. El repositorio incluye archivos de configuración (render.yaml y Procfile).
Pasos rápidos:

    Crea una cuenta en Render.

    Conecta tu repositorio de GitHub.

    Crea un nuevo Web Service seleccionando el repositorio.

    Configura:

        Nombre: portal-wifi-backend

        Entorno: Node

        Build Command: npm install

        Start Command: node server.js

        Plan: Gratuito

    Agrega las variables de entorno (ver sección siguiente).

    Haz clic en Create Web Service.

Render te proporcionará una URL como https://portal-wifi-backend.onrender.com.
Despliegue del frontend (portal de registro)

Puedes alojar el archivo index.html estático en GitHub Pages, Netlify o Vercel. Solo asegúrate de actualizar la constante API_URL en el script para que apunte a tu backend en Render.

Ejemplo en frontend/index.html:

    const API_URL = 'https://portal-wifi-backend.onrender.com/api';

🔐 Variables de Entorno

Crea un archivo .env en la carpeta backend con el siguiente contenido (ajusta los valores):

    # =============================================
    # CONFIGURACIÓN BACKEND - PORTAL WiFi MIGRANTES
    # =============================================
    
    # MongoDB Atlas Connection String
    MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/wifi-portal?retryWrites=true&w=majority
    
    # Puerto del servidor
    PORT=10000
    
    # Entorno (production/development)
    NODE_ENV=production
    
    # URLs permitidas para CORS (separadas por coma)
    ALLOWED_ORIGINS=https://tu-frontend.onrender.com,http://localhost:3000,http://localhost:5500
    
    # Redirección después del registro
    FRONTEND_REDIRECT=https://www.google.com
    
    # Configuraciones específicas para Guatemala (opcional)
    DEFAULT_DEPARTMENT=Guatemala
    DEFAULT_MUNICIPALITY=Ciudad de Guatemala
    SUPPORT_EMAIL=contacto@apoyomigrantesgt.org
    SUPPORT_PHONE=+502 1234 5678

Nota: Nunca subas tu archivo .env al repositorio. En producción (Render), configura estas variables en el panel de "Environment Variables".

🖥️ Uso del Panel de Administración

El panel está disponible en la ruta /admin de tu backend (ej. https://portal-wifi-backend.onrender.com/admin).
Funcionalidades destacadas:

    Filtros y búsqueda: Filtra por estado (activo/completado/bloqueado), fecha (hoy, semana, mes) y busca por nombre, teléfono o email.

    Tabla de usuarios:

        Ver información básica y redes sociales conectadas.

        Botones de acción: Ver detalle (modal con toda la info), Contactar (rellena el formulario de contacto rápido), Editar (en desarrollo).

    Contacto rápido:

        Selecciona un usuario y un canal (WhatsApp, llamada, SMS, email).

        Elige una plantilla o escribe un mensaje personalizado.

        Cada envío queda registrado en el historial del usuario.

    Exportaciones:

        Todos los datos: CSV completo.

        Lista de contactos: nombre, teléfono, email.

        Para WhatsApp: solo números de teléfono (formato compatible).

        Usuarios con redes sociales: aquellos que vincularon al menos una red.

    Estadísticas:

        Total de usuarios, conexiones hoy, usuarios con redes, tasa de crecimiento.

        Gráfico de registros diarios (últimos 7 días).

    Detalle de usuario:

        Información completa de contacto, conexión, redes sociales e historial de comunicación.

⚠️ Limitaciones y Pasos Futuros
1. Registro automático con redes sociales (OAuth)

Actualmente los usuarios deben ingresar manualmente sus perfiles sociales. Para una experiencia más fluida y datos verificados, se requiere implementar OAuth con Facebook, Google, etc. Esto permitiría:

    Obtener nombre, email y foto de perfil automáticamente.

    Reducir errores de escritura.

    Aumentar la tasa de vinculación de redes.

2. Integración con el hotspot WiFi

El sistema no está conectado al controlador del punto de acceso. Para un portal cautivo real se necesita:

    Configurar el router (MikroTik, pfSense, UniFi) para redirigir todo el tráfico HTTP a la página de registro.

    Tras un registro exitoso, autorizar la dirección MAC del dispositivo en el firewall durante un tiempo determinado (ej. 24 horas).

    Posible integración con servicios RADIUS o CoovaChilli.

3. Otras mejoras sugeridas

    Módulo de encuestas: al finalizar el registro, preguntar sobre necesidades específicas (empleo, vivienda, documentación).

    Sistema de tickets de ayuda: para dar seguimiento a casos individuales.

    Roles de usuario en el panel (admin, agente, observador).

    Internacionalización (español/inglés) para retornados de otros países.

    Envío masivo de mensajes mediante integración con Twilio (WhatsApp/SMS) o servicios de email.
