---
description: Guía obligatoria para diseñar, implementar, probar y
  mantener el frontend de un ecommerce de cosméticos, belleza e higiene
  con React y TypeScript.
name: skill-fronted-web-comercio
---

# Skill Frontend --- Web de comercio

## 1. Propósito

Construir una interfaz de comercio electrónico profesional, accesible,
responsive, segura desde el punto de vista del cliente y fácil de
mantener. La plataforma tendrá una tienda pública, una zona de cuenta de
cliente y un panel administrativo protegido.

Esta guía es una especificación de trabajo: antes de implementar una
fase, revisar los requisitos y criterios de aceptación correspondientes.
No construir toda la aplicación en un único paso.

## 2. Stack tecnológico

-   **Lenguaje principal:** TypeScript con `strict` habilitado.
-   **Biblioteca de interfaz:** React.
-   **Herramienta de desarrollo y build:** Vite.
-   **Estilos:** CSS moderno con variables de diseño; Tailwind CSS es
    opcional, no obligatorio.
-   **Enrutamiento:** React Router o alternativa mantenida equivalente,
    previa revisión de compatibilidad y seguridad.
-   **Formularios:** React Hook Form y Zod pueden utilizarse si las
    versiones se revisan y se justifica su necesidad.
-   **Pruebas:** Vitest y React Testing Library; Playwright para pruebas
    de extremo a extremo.
-   **Gestión de dependencias:** npm con archivo de bloqueo
    (`package-lock.json`).

Usar React como aplicación cliente (CSR) con Vite en la primera versión.
No introducir React Server Components, Server Actions ni un framework
full-stack con ejecución de código de servidor si no existe una
necesidad explícita y una revisión de seguridad específica. No se debe
asumir que una biblioteca está libre de vulnerabilidades solo porque sea
popular.

## 3. Proceso obligatorio antes de instalar dependencias

1.  Consultar avisos oficiales de seguridad del proyecto y su registro
    de versiones.
2.  Revisar la versión exacta y su soporte activo.
3.  Consultar vulnerabilidades conocidas de la versión y de sus
    dependencias transitivas.
4.  Instalar una versión corregida y soportada, no una versión antigua
    fijada por un tutorial.
5.  Guardar el lockfile y ejecutar auditoría de dependencias.
6.  Investigar cada hallazgo; actualizar, reemplazar o documentar
    temporalmente la mitigación con responsable y fecha límite.
7.  Repetir las comprobaciones antes de publicar y periódicamente
    después del lanzamiento.

Fuentes de revisión: - React:
https://github.com/facebook/react/security/advisories - React blog:
https://react.dev/blog - npm audit:
https://docs.npmjs.com/cli/commands/npm-audit - Vite:
https://github.com/vitejs/vite/security/advisories - OWASP:
https://owasp.org/www-project-top-ten/

La revisión de avisos es una fotografía temporal, no una garantía de
ausencia de vulnerabilidades futuras.

## 4. Estructura sugerida

``` text
frontend/
  public/
  src/
    app/
      router/
      providers/
    assets/
    components/
      ui/
      layout/
    features/
      catalog/
      search/
      cart/
      checkout/
      account/
      orders/
      admin/
      promotions/
      reports/
    hooks/
    lib/
      api/
      validation/
      formatting/
    styles/
    types/
    test/
    main.tsx
  index.html
  package.json
  package-lock.json
  tsconfig.json
  vite.config.ts
```

Reglas: - Organizar por funcionalidad; evitar carpetas gigantes con
componentes sin relación. - Mantener componentes visuales reutilizables
en `components/ui`. - Mantener reglas y estado específicos de una
función dentro de `features/<función>`. - No duplicar reglas de negocio
del backend como si fueran autoridad. El frontend puede anticipar
validaciones para mejorar la experiencia, pero el backend decide. -
Evitar un único componente que concentre toda la tienda o todo el panel
administrativo. - Evitar abstracciones prematuras y dependencias
innecesarias.

## 5. Diseño UI/UX y sistema visual

Antes de crear pantallas, definir tokens de diseño: - Tipografía y
escala tipográfica. - Colores semánticos: fondo, superficie, texto,
texto secundario, borde, acción, éxito, advertencia y error. -
Espaciado, radios, elevaciones, anchuras máximas y puntos de quiebre. -
Estados de controles: normal, hover, focus, disabled, loading, error y
success. - Componentes base: botón, input, select, checkbox, modal,
alert, badge, tabla, tarjeta, paginación y skeleton.

Criterios: - Diseño mobile-first y adaptable a móvil, tableta y
escritorio. - Jerarquía visual clara, navegación consistente y búsqueda
visible. - Fotos de producto nítidas, proporciones coherentes y texto
alternativo útil. - Mostrar precio, precio promocional cuando
corresponda, disponibilidad y detalles relevantes sin ambigüedad. -
Carrito y checkout con resumen claro, costos de envío e impuestos
aplicables antes de confirmar. - Formularios con etiquetas persistentes,
instrucciones y errores comprensibles. - No usar el color como única
forma de comunicar estados. - Mantener contraste suficiente y foco de
teclado visible. - Respetar `prefers-reduced-motion`; evitar animaciones
que bloqueen tareas. - No mostrar datos de ejemplo como si fueran ventas
reales. - Confirmar acciones destructivas y permitir recuperación cuando
sea razonable.

Objetivo de accesibilidad: WCAG 2.2 nivel AA, con pruebas automatizadas
y revisión manual con teclado y lector de pantalla. La automatización
por sí sola no certifica accesibilidad.

## 6. Rutas y permisos de interfaz

Separar, como mínimo: - Tienda pública: inicio, categorías, listado,
búsqueda, detalle de producto. - Compra: carrito, checkout y
confirmación. - Cuenta de cliente: perfil, direcciones y pedidos
propios. - Administración: dashboard, catálogo, imágenes, inventario,
pedidos, promociones, contenido, clientes, informes y configuración.

La protección de rutas en el frontend solo mejora la navegación. **No es
un control de seguridad suficiente**: el backend debe autorizar cada
operación y cada recurso. No codificar claves secretas, credenciales de
proveedor ni secretos de administración en React o en variables
`VITE_*`; estas variables pueden terminar expuestas en el bundle.

## 7. Integración con la API

-   Centralizar llamadas HTTP en una capa API tipada.
-   Definir tipos para solicitudes y respuestas, sin asumir que
    TypeScript valida los datos recibidos en tiempo de ejecución.
-   Validar datos externos cuando sea importante hacerlo.
-   Manejar estados loading, empty, success y error.
-   Aplicar cancelación de solicitudes cuando proceda y evitar
    actualizaciones de estado obsoletas.
-   Usar paginación y filtros del servidor para catálogos grandes e
    informes.
-   No confiar en importes, roles, stock, cupones ni estado de pago
    calculados en el navegador.
-   No registrar tokens, contraseñas, datos de pago ni información
    personal innecesaria en consola.
-   No renderizar HTML arbitrario con `dangerouslySetInnerHTML`. Si una
    función editorial exige HTML, sanitizarlo con una biblioteca
    mantenida y una política estricta.
-   No almacenar tokens de sesión de larga duración en `localStorage`
    por comodidad. Preferir el mecanismo de sesión acordado con el
    backend, idealmente cookies `HttpOnly`, `Secure` y `SameSite` cuando
    la arquitectura lo permita.
-   Si se usan cookies de autenticación, coordinar con backend
    protección CSRF y política CORS restrictiva.

## 8. Reglas de TypeScript y código limpio

-   Mantener `strict: true`; evitar `any`, `@ts-ignore` y conversiones
    forzadas sin justificación.
-   Preferir tipos explícitos en contratos de API y datos de dominio.
-   Separar presentación, estado de interfaz y llamadas de red.
-   Utilizar nombres que expresen intención.
-   Mantener componentes pequeños y con una responsabilidad
    identificable.
-   Extraer lógica compartida solo cuando exista duplicación real.
-   Evitar lógica compleja dentro del JSX.
-   No duplicar validaciones de seguridad como sustituto del backend.
-   Centralizar formatos de moneda, fechas y cantidades; definir moneda
    y zona horaria según los requisitos del negocio.
-   Mostrar importes en COP si ese es el mercado configurado; no inferir
    que el precio incluye impuestos si no está definido por el negocio.
-   No mantener en estado información derivable de otros estados si
    puede calcularse de forma fiable.
-   Tratar errores y estados vacíos como parte del diseño, no como casos
    excepcionales olvidados.

## 9. Seguridad frontend

-   Mantener React y todas las dependencias en versiones soportadas y
    corregidas.
-   Aplicar CSP y cabeceras de seguridad en el servidor/CDN, probando
    primero los recursos legítimos requeridos.
-   Usar HTTPS en producción.
-   No incluir secretos ni claves privadas en el bundle.
-   Evitar XSS: no insertar HTML sin sanitizar ni construir código
    ejecutable con datos del usuario.
-   Validar y limitar archivos antes de subirlos; el backend debe
    validar también el contenido real.
-   No asumir que ocultar un botón impide usar el endpoint.
-   No exponer información de otro cliente en pantallas, estados, logs
    ni cachés.
-   No poner información sensible en URLs, parámetros de consulta ni
    herramientas de analítica.
-   Configurar CORS en backend; CORS no sustituye autenticación ni
    autorización.
-   No incorporar scripts de terceros sin evaluación de necesidad,
    privacidad y seguridad.

## 10. Pruebas obligatorias

-   Unitarias para funciones de formato, validación de interfaz y lógica
    pura.
-   Componentes para formularios, errores, carga, accesibilidad básica y
    navegación.
-   Integración para flujos con API simulada o entorno de pruebas.
-   E2E para búsqueda, detalle, carrito, checkout, login, historial de
    pedidos y flujos administrativos.
-   Pruebas responsive en anchos móvil, tableta y escritorio.
-   Pruebas de teclado, foco, contraste y etiquetas.
-   Pruebas de errores de red, expiración de sesión y respuestas
    401/403/404/409/500.
-   Confirmar que un cliente no puede ver enlaces o datos
    administrativos por error, aunque la autorización real corresponde
    al backend.

## 11. Calidad automatizada y CI

Antes de integrar cambios: 1. Formatear y revisar lint. 2. Ejecutar
comprobación de tipos. 3. Ejecutar pruebas unitarias. 4. Construir
bundle de producción. 5. Ejecutar auditoría de dependencias. 6. Ejecutar
pruebas E2E en cambios críticos. 7. Revisar tamaño del bundle y errores
de consola. 8. Bloquear la integración si fallan comprobaciones
esenciales.

No ignorar advertencias de seguridad de forma global para hacer pasar el
pipeline.

## 12. Rendimiento

-   Optimizar imágenes (formatos modernos, tamaños adecuados y carga
    diferida donde aplique).
-   Cargar de forma diferida las rutas administrativas e informes si
    aporta valor.
-   Evitar bibliotecas grandes para tareas pequeñas.
-   Usar paginación del servidor.
-   Evitar peticiones repetidas y renders innecesarios.
-   Definir objetivos de rendimiento medibles y revisar Core Web Vitals.
-   Probar en dispositivos y conexiones modestos, no solo en el equipo
    de desarrollo.

## 13. Fases de implementación

1.  Requisitos, perfiles de usuario y flujos.
2.  Tokens visuales, accesibilidad y componentes base.
3.  Navegación, layout y páginas estáticas.
4.  Catálogo, búsqueda y detalle de producto.
5.  Carrito conectado a la API.
6.  Autenticación y cuenta de cliente.
7.  Checkout y estados de pedido.
8.  Panel administrativo por módulos.
9.  Informes y visualizaciones con datos reales.
10. Endurecimiento de seguridad, pruebas E2E y despliegue.

Cada fase debe cerrar con una demostración, pruebas aprobadas y
criterios de aceptación documentados.

## 14. Criterios de aceptación antes de dar por terminado el frontend

-   [ ] Responsive y accesible según los objetivos acordados.
-   [ ] Sin errores TypeScript, lint ni build.
-   [ ] Los estados de carga, vacío, éxito y error están diseñados.
-   [ ] Los contratos de API están tipados y se manejan fallos.
-   [ ] No hay secretos en el código entregado al navegador.
-   [ ] No se confía en el cliente para precios, permisos o pagos.
-   [ ] Dependencias revisadas y vulnerabilidades corregidas o
    documentadas.
-   [ ] Pruebas unitarias, integración y E2E relevantes pasan.
-   [ ] El bundle de producción se genera de forma reproducible.
-   [ ] Se documentan decisiones técnicas y pasos para ejecutar el
    proyecto.

## 15. Regla de trabajo para el asistente/desarrollador

Trabajar una fase a la vez. Antes de escribir código: 1. Explicar el
objetivo y los archivos que se modificarán. 2. Confirmar requisitos que
cambien la arquitectura. 3. Proponer una solución simple. 4. Implementar
solo el alcance acordado. 5. Ejecutar comprobaciones disponibles y
reportar exactamente qué pasó. 6. Enumerar limitaciones, riesgos y
siguiente paso.

No afirmar que una prueba, auditoría o despliegue fue exitoso si no se
ejecutó realmente.
