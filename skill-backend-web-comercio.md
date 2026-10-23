---
description: Guía obligatoria para diseñar, implementar, proteger,
  probar y desplegar el backend de un ecommerce de cosméticos, belleza e
  higiene.
name: skill-backend-web-comercio
---

# Skill Backend --- Web de comercio

## 1. Propósito

Construir un backend transaccional, modular, seguro y mantenible para
una tienda de cosméticos, belleza e higiene. Debe atender la tienda y el
panel administrativo mediante una API versionada, preservar la
integridad de pedidos e inventario, y generar informes basados en datos
consistentes.

## 2. Stack tecnológico acordado

-   **Lenguaje backend:** Java, con una versión LTS soportada por el
    ecosistema seleccionado. Confirmar la matriz de compatibilidad antes
    de iniciar; usar Java 21 LTS como base inicial si continúa soportado
    y compatible con la versión elegida.
-   **Framework backend:** Spring Boot, en una versión estable,
    soportada y corregida.
-   **Seguridad:** Spring Security.
-   **API:** HTTP REST, JSON y OpenAPI para documentar contratos.
-   **Persistencia:** Spring Data JPA/Hibernate para acceso ORM; SQL
    parametrizado cuando corresponda.
-   **Base de datos:** PostgreSQL, en una rama soportada con las últimas
    actualizaciones de seguridad.
-   **Migraciones:** Flyway o Liquibase; elegir una herramienta y
    mantenerla consistente.
-   **Validación:** Jakarta Bean Validation.
-   **Pruebas:** JUnit, Spring Boot Test y Testcontainers para pruebas
    de integración realistas.
-   **Build:** Maven o Gradle; elegir uno y fijar el wrapper del
    proyecto.
-   **Observabilidad:** logs estructurados, métricas y health checks con
    acceso protegido.
-   **Contrato con frontend:** TypeScript en el cliente; Java no
    comparte el lenguaje con el frontend, por lo que los contratos se
    documentan y prueban mediante OpenAPI.

No añadir microservicios al inicio. Utilizar un **monolito modular** con
límites claros y una sola unidad de despliegue. Separar servicios
independientes solo cuando existan razones de escala, aislamiento o
despliegue demostrables.

## 3. Revisión de seguridad previa a elegir versiones

La existencia de avisos de seguridad no significa que el framework
completo sea inseguro; significa que hay que elegir versiones
corregidas, soportadas y compatibles. No es técnicamente correcto
prometer que una tecnología no tiene vulnerabilidades reportadas.

Durante la revisión inicial se consultaron fuentes oficiales el 22 de
octubre de 2026: - Spring publica avisos de seguridad para sus
proyectos, incluidos Spring Security y Spring Data:
https://spring.io/security/ - React mantiene avisos de seguridad y ha
publicado vulnerabilidades de severidad alta y crítica, especialmente en
React Server Components y funciones de servidor:
https://github.com/facebook/react/security/advisories - PostgreSQL
mantiene una lista de vulnerabilidades conocidas y versiones corregidas:
https://www.postgresql.org/support/security/ - Node.js publicó
actualizaciones de seguridad el 21 de octubre de 2026:
https://nodejs.org/en/blog/vulnerability/october-2026-security-releases

Conclusión práctica: 1. No se declara que una versión concreta esté
libre de vulnerabilidades sin revisar su número exacto y su árbol de
dependencias. 2. Evitar React Server Components/Server Actions en la
primera versión; usar React cliente con Vite reduce la exposición a esa
clase específica de componentes del servidor, pero no elimina riesgos de
frontend ni de dependencias. 3. Elegir una versión de Spring Boot que
incluya las versiones corregidas de Spring Framework, Spring Security y
dependencias transitivas. 4. Seleccionar una versión soportada de
PostgreSQL y aplicar actualizaciones de seguridad. La página oficial
muestra vulnerabilidades y versiones corregidas, por lo que no se debe
instalar una versión sin parchear. 5. No fijar versiones de ejemplo en
este documento como si fueran recomendación actual permanente. Consultar
avisos y matrices de soporte justo antes de generar el proyecto y antes
de publicar. 6. Guardar un registro de versiones elegidas, avisos
consultados, fecha de consulta y decisiones de mitigación.

Fuentes adicionales: - Spring Boot:
https://spring.io/projects/spring-boot - Spring Security:
https://spring.io/projects/spring-security - Java releases:
https://www.oracle.com/java/technologies/java-se-support-roadmap.html -
OWASP ASVS:
https://owasp.org/www-project-application-security-verification-standard/ -
OWASP API Security: https://owasp.org/www-project-api-security/ -
PostgreSQL releases: https://www.postgresql.org/support/versioning/ -
GitHub Advisory Database: https://github.com/advisories - OWASP
Dependency-Check: https://owasp.org/www-project-dependency-check/

## 4. Arquitectura y límites de módulos

Estructura orientativa:

``` text
backend/
  src/main/java/com/tienda/
    config/
    security/
    shared/
      errors/
      api/
      validation/
    users/
    catalog/
    inventory/
    cart/
    orders/
    payments/
    promotions/
    content/
    customers/
    reports/
    finance/
    audit/
  src/main/resources/
    application.yml
    db/migration/
  src/test/java/
  pom.xml
  mvnw
```

Cada módulo debe contener su API de entrada, lógica de aplicación,
modelo de dominio y acceso a datos en una estructura proporcional a su
complejidad. No crear una estructura excesivamente ceremoniosa para CRUD
simples, pero tampoco mezclar todas las funciones en una única clase o
paquete.

Responsabilidades: - `users/security`: identidad, roles, permisos y
sesiones. - `catalog`: productos, categorías, atributos, estado y
precios de catálogo. - `inventory`: movimientos, existencias, lotes y
vencimientos cuando aplique. - `cart`: carrito y validación previa al
pedido. - `orders`: pedidos, líneas, importes históricos y estados. -
`payments`: integración con proveedor, conciliación y reembolsos. -
`promotions`: cupones, campañas, reglas y límites de uso. - `content`:
banners, anuncios y contenido de tienda. - `reports/finance`: métricas,
ventas, costos y reportes. - `audit`: registro de operaciones
administrativas relevantes.

Los módulos deben comunicarse mediante interfaces o servicios internos
definidos. Evitar dependencias circulares y acceso directo a tablas de
otros módulos sin un contrato claro.

## 5. Capas y responsabilidades

-   **Controller:** HTTP, parámetros, DTOs, códigos de estado y contrato
    de API. No contiene reglas centrales del negocio.
-   **Application service:** coordina casos de uso y transacciones.
-   **Domain/model:** reglas de negocio e invariantes.
-   **Repository:** persistencia, consultas y carga de entidades.
-   **DTO/mapper:** frontera explícita entre entrada/salida HTTP y
    entidades persistentes.
-   **Exception handler global:** errores predecibles y formato
    uniforme, sin exponer trazas internas al cliente.

No devolver entidades JPA directamente desde endpoints. No aceptar DTOs
que permitan al cliente modificar campos protegidos como `role`,
`paymentStatus`, `unitCost`, `stock` o `isAdmin` sin un caso de uso
autorizado específico.

## 6. Principios de código limpio

-   Una responsabilidad clara por clase y método.
-   Nombres expresivos y consistentes.
-   Principios SOLID aplicados con criterio, no como ritual.
-   Evitar duplicación de reglas de precios, impuestos, descuentos y
    permisos.
-   Evitar métodos enormes, lógica de negocio en controladores y acceso
    directo a `EntityManager` desde cualquier capa.
-   Preferir composición sobre jerarquías innecesarias.
-   Definir límites transaccionales explícitos.
-   Usar tipos apropiados para dinero, cantidades, estados y fechas.
-   Usar `BigDecimal` para importes monetarios; nunca `float` o `double`
    para dinero.
-   Usar `Instant`/`OffsetDateTime` para instantes y definir
    explícitamente la zona horaria comercial.
-   Definir estados mediante enums o modelos controlados, evitando
    cadenas libres para estados críticos.
-   No silenciar excepciones ni devolver éxito genérico ante un fallo.
-   No registrar datos sensibles.
-   Documentar decisiones arquitectónicas relevantes en ADRs breves.

## 7. Modelo de dominio y base de datos

El diseño final debe seguir los requisitos acordados. Como punto de
partida, evaluar estas entidades: - User, Role/Permission y
CustomerProfile. - Product, Category, ProductImage y ProductVariant si
hay variantes. - InventoryItem/StockBalance, StockMovement, Lot y
ExpirationDate cuando aplique. - Cart y CartItem si el carrito se
persiste en servidor. - Order, OrderItem, AddressSnapshot y
OrderStatusHistory. - Payment, PaymentAttempt y Refund. - Coupon,
Promotion, PromotionRedemption. - Supplier y Purchase/Receiving si se
administran compras. - AuditEvent. - Entidades de contabilidad/reportes
solo después de definir qué significa cada métrica.

Reglas: - Claves primarias y foráneas explícitas. - Restricciones
`NOT NULL`, `UNIQUE`, `CHECK` e índices conforme al dominio. - No
depender solo de validaciones Java para restricciones de integridad. -
Guardar en la línea del pedido una instantánea de nombre/SKU, precio
unitario, descuento e impuestos aplicados al momento de la compra. -
Registrar movimientos de inventario, no solo sobrescribir una cifra sin
historial. - Guardar moneda y reglas de redondeo de forma explícita. -
Usar migraciones versionadas; no editar migraciones ya aplicadas en
entornos compartidos. - Separar datos de prueba de datos reales. - Usar
usuarios de base de datos con privilegios mínimos; la aplicación no debe
conectarse como superusuario. - Establecer política de retención,
privacidad y eliminación/anonimización de datos personales.

## 8. Seguridad de autenticación y autorización

-   Usar Spring Security y mecanismos estándar, no criptografía o
    autenticación casera.
-   Guardar contraseñas con algoritmo de hash adaptativo y parámetros
    actuales recomendados; Argon2id es una opción si la biblioteca y el
    entorno la soportan correctamente.
-   Diseñar roles iniciales como `CUSTOMER`, `ADMIN` y, si se necesita,
    `STAFF` con permisos limitados.
-   Aplicar denegación por defecto y mínimo privilegio.
-   Autorizar cada endpoint y cada recurso en el servidor.
-   Prevenir IDOR/BOLA: un usuario solo puede consultar y modificar sus
    propios pedidos, direcciones y datos salvo permiso explícito.
-   No permitir que una solicitud de registro público asigne rol de
    administrador.
-   Proteger login y recuperación de contraseña contra abuso; limitar
    intentos con una estrategia que evite bloqueos abusables.
-   Usar mensajes de autenticación que no revelen si un correo está
    registrado.
-   Para sesiones por cookie, configurar `HttpOnly`, `Secure`,
    `SameSite`, expiración y protección CSRF apropiadas.
-   Para JWT, si se adopta, definir expiración corta, validación de
    emisor/audiencia, rotación y revocación según el caso. No usar JWT
    por moda ni guardar tokens de larga duración en `localStorage`.
-   CORS debe permitir solo los orígenes requeridos; no usar comodines
    con credenciales.
-   Aplicar HTTPS, cabeceras de seguridad, límites de solicitudes y
    tamaños máximos de payload.
-   Secretos en un gestor de secretos o variables seguras de entorno;
    nunca en Git, imágenes de contenedor o logs.
-   Auditar operaciones sensibles: cambios de roles, precio, stock,
    promociones, cancelaciones, reembolsos y configuración.

## 9. Validación y protección de la API

-   Validar entradas con Jakarta Bean Validation y validaciones de
    dominio.
-   Consultas SQL parametrizadas; no concatenar datos del usuario en
    SQL.
-   Limitar paginación, tamaño de listas, carga de archivos y
    profundidad de filtros.
-   Validar tipos, longitudes, rangos, formatos y combinaciones de
    campos.
-   Usar una política uniforme de errores; no enviar stack traces ni
    detalles internos en producción.
-   Usar `application/problem+json` o un contrato de error equivalente.
-   Versionar la API si cambios incompatibles lo requieren.
-   Definir OpenAPI y probar que los contratos concuerden con la
    implementación.
-   Aplicar rate limiting donde corresponda, especialmente login,
    recuperación, cupones y operaciones de compra.
-   No confiar en datos del navegador para precios, permisos, stock,
    descuentos o estado de pago.
-   Validar URL y origen de webhooks y verificar las firmas con el
    mecanismo oficial del proveedor.
-   Nunca almacenar datos completos de tarjetas bancarias; usar un
    proveedor de pagos y tokenización adecuados.

## 10. Integridad transaccional de pedidos, pagos e inventario

Este dominio es crítico y requiere pruebas de concurrencia.

### Creación de pedido

1.  Recibir identificadores y cantidades, no un total confiable del
    cliente.
2.  Cargar precios actuales desde el servidor.
3.  Validar disponibilidad, límites de compra y cupones.
4.  Calcular importes con reglas explícitas de redondeo.
5.  Crear pedido y líneas con sus instantáneas históricas.
6.  Reservar o descontar stock con una estrategia atómica.
7.  Confirmar transacción o revertirla ante fallo.

### Pagos

-   Mantener estados de pedido y pago separados.
-   Modelar estados permitidos y transiciones válidas.
-   Confirmar el pago solo con una notificación autenticada/verificada o
    consulta fiable al proveedor.
-   Diseñar webhooks idempotentes para que una notificación repetida no
    duplique el cobro ni la actualización.
-   No interpretar una redirección del navegador como prueba de pago.
-   Registrar intentos, referencias externas y reembolsos.
-   Definir qué sucede ante timeout, pago pendiente, pago rechazado o
    webhook tardío.

### Inventario

-   Usar transacciones y controles de concurrencia apropiados.
-   Evitar que dos pedidos vendan la última unidad simultáneamente.
-   Registrar movimientos y motivo del ajuste.
-   Definir reserva, expiración de reserva, cancelación y reposición.
-   Para lotes/vencimientos, definir reglas de asignación y
    trazabilidad.

Considerar claves de idempotencia en operaciones de compra y pago. No
afirmar que una operación es idempotente sin probar solicitudes
duplicadas y condiciones de carrera.

## 11. Informes y finanzas

Definir cada métrica antes de escribir consultas: - Ventas brutas,
descuentos, devoluciones y ventas netas. - Número de pedidos, unidades y
ticket promedio. - Costo de mercancía vendida, margen bruto y utilidad
estimada. - Rendimiento de cupones y campañas. - Rotación de inventario,
agotados, lotes próximos a vencer. - Ranking de productos por unidades,
ingresos o margen, especificando cuál criterio se usa.

Distinguir ingresos de cobros, pedidos de ventas confirmadas, compras de
proveedores de costo de mercancía vendida y utilidad estimada de
utilidad contable oficial. Guardar snapshots y movimientos históricos
cuando sean necesarios. El dashboard comercial no reemplaza contabilidad
formal ni obligaciones tributarias colombianas; revisar facturación
electrónica, tratamiento tributario y requisitos regulatorios con
profesionales competentes.

## 12. Pruebas obligatorias

-   Unitarias para reglas de negocio y transiciones de estado.
-   Integración con PostgreSQL real mediante Testcontainers cuando sea
    viable.
-   Pruebas de autorización por rol y por propietario del recurso.
-   Pruebas de validación y errores.
-   Pruebas de migraciones desde una base vacía y desde la versión
    anterior soportada.
-   Pruebas de concurrencia para compra de últimas unidades, cupones
    limitados y actualizaciones de stock.
-   Pruebas de idempotencia de pagos/webhooks.
-   Pruebas de rollback ante fallos dentro de transacciones.
-   Pruebas de límites, rate limiting, archivos y payloads grandes.
-   Pruebas de rendimiento con volúmenes razonables y consultas del
    dashboard.
-   Pruebas de restauración de backup y procedimiento de recuperación.
-   No usar únicamente mocks para probar semántica de transacciones o
    restricciones de PostgreSQL.

## 13. Dependencias, CI y cadena de suministro

-   Fijar versiones y mantener wrapper/build reproducible.
-   Revisar avisos de seguridad oficiales de Spring, Java, PostgreSQL y
    dependencias transitivas.
-   Ejecutar escaneo de dependencias (por ejemplo OWASP Dependency-Check
    o herramienta equivalente) y revisión de imágenes de contenedor.
-   Revisar licencias de dependencias.
-   Mantener SBOM si el proceso de despliegue lo permite.
-   Actualizar dependencias con un proceso controlado y ejecutar la
    suite completa.
-   Bloquear release ante vulnerabilidades críticas/altas sin corrección
    o mitigación aprobada.
-   No descargar dependencias desde repositorios desconocidos ni
    ejecutar scripts sin revisión.
-   No ocultar vulnerabilidades simplemente suprimiendo alertas.

Pipeline mínimo: 1. Compilación. 2. Formato/lint si está configurado. 3.
Pruebas unitarias. 4. Pruebas de integración. 5. Escaneo de dependencias
y secretos. 6. Análisis estático. 7. Empaquetado reproducible. 8.
Pruebas de contrato/E2E según cambios. 9. Despliegue controlado a
staging y aprobación antes de producción.

## 14. Configuración y operación

-   Separar `local`, `test`, `staging` y `production`.
-   Usar perfiles de configuración sin incluir secretos en el
    repositorio.
-   Proteger endpoints de administración, métricas y health details.
-   Configurar logs estructurados con identificador de correlación.
-   No registrar contraseñas, tokens, datos completos de pago ni datos
    personales innecesarios.
-   Métricas y alertas para tasa de error, latencia, saturación, fallos
    de pagos y conexiones de base de datos.
-   Backups automáticos con cifrado, retención y pruebas periódicas de
    restauración.
-   Definir RPO/RTO apropiados para el negocio.
-   Ejecutar migraciones de forma controlada; comprobar compatibilidad
    con la versión anterior durante despliegues.
-   Tener procedimiento de rollback o forward-fix documentado.
-   HTTPS obligatorio en producción; base de datos no expuesta
    públicamente salvo necesidad documentada.
-   Principio de mínimo privilegio en sistema operativo, nube, base de
    datos y proveedor de pagos.

## 15. Fases de implementación

1.  Requisitos, actores, reglas del negocio y flujos.
2.  Arquitectura modular, decisiones registradas y modelo inicial de
    amenazas.
3.  Repositorio, configuración, CI y entornos.
4.  Usuarios, autenticación, autorización y auditoría.
5.  Catálogo y categorías.
6.  Inventario, movimientos, lotes y vencimientos si aplican.
7.  Carrito y pedidos.
8.  Integración de pagos y webhooks.
9.  Promociones, cupones y contenido.
10. Informes y finanzas con definiciones aprobadas.
11. Pruebas de seguridad, rendimiento y recuperación.
12. Despliegue, monitoreo y mantenimiento.

Cada fase debe tener requisitos verificables, pruebas y revisión de
seguridad. No avanzar a pagos reales antes de probar estados fallidos,
duplicados y conciliación en un entorno de pruebas del proveedor.

## 16. Criterios de aceptación antes de producción

-   [ ] Versiones exactas seleccionadas y comprobadas contra avisos
    oficiales vigentes.
-   [ ] No quedan vulnerabilidades críticas/altas sin resolución o
    excepción formal.
-   [ ] Autenticación, autorización por recurso y denegación por defecto
    están probadas.
-   [ ] No hay secretos en el repositorio ni en logs.
-   [ ] Restricciones e integridad referencial están en la base de
    datos.
-   [ ] Transacciones y concurrencia de inventario están probadas.
-   [ ] Webhooks y operaciones críticas son idempotentes donde
    corresponde.
-   [ ] Migraciones, backups y restauración están verificados.
-   [ ] Logs, métricas, alertas y manejo de errores están configurados.
-   [ ] Pruebas unitarias, integración y seguridad relevantes pasan.
-   [ ] Documentación OpenAPI y guía de despliegue están actualizadas.
-   [ ] Se documentaron riesgos pendientes y responsables.

## 17. Regla de trabajo para el asistente/desarrollador

Trabajar una fase a la vez. Antes de escribir código: 1. Explicar
objetivo, límites y archivos afectados. 2. Identificar ambigüedades de
negocio que puedan afectar integridad o seguridad. 3. Proponer la
solución mínima correcta. 4. Implementar únicamente el alcance aprobado.
5. Ejecutar pruebas y auditorías disponibles, indicando comandos y
resultados reales. 6. No declarar una vulnerabilidad corregida sin
identificar versión/commit y prueba. 7. No declarar el sistema seguro ni
libre de vulnerabilidades de forma absoluta. 8. Documentar limitaciones
y el siguiente paso recomendado.
