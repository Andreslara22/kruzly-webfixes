# kruzly-webfixes

Scripts que la app de prueba de Kruzly baja al abrir cada red y ejecuta dentro de su web.
Sirven para corregir cómo se ve una web (por ejemplo WhatsApp Web) sin recompilar la app.

- `whatsapp.js`, `instagram.js`, `facebook.js`… uno por red (el nombre es el id de la red en la app).
- La app los pide con `?t=<hora>` para no usar caché. Después de editar, basta con tocar Recargar en Kruzly.
- Este repo es público a propósito: la app no guarda ninguna contraseña para leerlo. No pongas nada privado aquí.
- Solo se usa en builds de prueba (debug); la versión de tienda no baja nada.
