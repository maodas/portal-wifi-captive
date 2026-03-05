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
Despliegue	Render (backend), GitHub Pages / Netlify (frontend)
Control de Versiones	Git + GitHub
