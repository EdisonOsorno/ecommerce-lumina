# Documento de Requisitos y Reglas de Negocio — Lúmina (ecommerce-cosmeticos)

**Proyecto:** Comercio electrónico funcional de cosméticos, belleza e higiene  
**Nombre provisional de marca:** Lúmina (nombre técnico/fallback: `Belleza Demo`)  
**Fecha de elaboración:** 22 de octubre de 2026  
**Estado:** Fase 0 — Inspección, Especificación y Planificación  

---

## 1. Requisitos Confirmados

Los siguientes requisitos han sido confirmados y aprobados explícitamente en el pliego de condiciones técnicas y en los skills de trabajo:

### 1.1 Identidad y Configuración General
- **Marca:** Lúmina. Toda la identidad (nombre, logotipo, eslóganes, enlaces de redes, metadatos) debe estar centralizada en archivos de configuración/constantes tanto en frontend como en backend para facilitar personalizaciones o cambios de marca sin dispersión de código.
- **Entorno inicial:** Ejecución local controlada, reproducible, con datos ficticios e identificables como de prueba.

### 1.2 Stack y Arquitectura Técnica
- **Arquitectura general:** Monolito modular. Responsabilidades estrictamente separadas entre capas (API REST, servicios de aplicación, dominio, persistencia) y límites claros entre módulos funcionales. No microservicios al inicio.
- **Frontend:**
  - React con TypeScript en modo estricto (`strict: true`).
  - Bundler y dev server: Vite.
  - SPA/CSR (Client-Side Rendering). Quedan excluidos React Server Components y Server Actions en esta versión.
  - Estilos: CSS moderno con tokens de diseño y variables CSS.
  - Enrutamiento: React Router.
  - Pruebas: Vitest + React Testing Library; Playwright para E2E en flujos principales.
  - Accesibilidad objetivo: WCAG 2.2 nivel AA (contraste, navegación por teclado, focus visible, soporte lector de pantalla, `prefers-reduced-motion`).
- **Backend:**
  - Java 21 LTS como base inicial (tras comprobación de dependencias y soporte).
  - Spring Boot en versión estable y soportada.
  - Spring Security para autenticación, autorización por endpoint y control de acceso por recurso.
  - Spring Data JPA con Hibernate, con mapeo explícito y uso de `BigDecimal` para valores monetarios e `Instant`/`OffsetDateTime` para fechas con zona horaria comercial fija.
  - Jakarta Bean Validation para validación formal de DTOs en entrada.
  - OpenAPI/Swagger para documentación viva del contrato REST.
  - Pruebas: JUnit 5, Spring Boot Test y Testcontainers para PostgreSQL real.
- **Persistencia:**
  - PostgreSQL en versión soportada con restricciones a nivel de base de datos (`NOT NULL`, `CHECK`, `UNIQUE`, `FOREIGN KEY`).
  - Migraciones de esquema versionadas mediante una sola herramienta (Flyway como propuesta estándar en Spring Boot).

### 1.3 Seguridad y Autoridad del Servidor
- **El backend es la única autoridad:** Precios, descuentos, cupones, cálculo de subtotales/totales, stock y estados de pago se calculan y validan exclusivamente en el backend. El frontend nunca envía precios totales de confianza.
- **Hash de contraseñas:** Algoritmo adaptativo (preferentemente Argon2id o BCrypt con factor de costo adecuado si el entorno de ejecución lo soporta).
- **Protección contra IDOR / BOLA:** Cada cliente solo puede acceder y modificar sus propios pedidos, carritos y direcciones.
- **Protección de datos sensibles:** Ninguna contraseña, número de tarjeta bancaria, token secreto ni clave de proveedor debe registrarse en logs, ni guardarse en GitHub, ni exponerse en variables públicas (`VITE_*`).
- **Pagos:** Nunca se almacenarán números completos de tarjetas bancarias ni CVV. Se usará pasarela/tokenización y para fases iniciales una simulación o sandbox explícito y aislado.
- **Transaccionalidad e Idempotencia:** Control de concurrencia en inventario (evitar vender más de las unidades disponibles) y soporte de idempotencia en webhooks/pagos.
- **Manejo de errores:** RFC 7807 (`application/problem+json`) o formato estándar uniforme, sin exponer trazas de excepciones internas en respuestas HTTP.

### 1.4 Reglas Comerciales Acordadas (Actualizado)
- **Modalidad de compra:** Se permite la compra tanto a usuarios registrados como a **usuarios invitados (*Guest Checkout*)**. El invitado solo requiere suministrar nombre, correo electrónico y datos de despacho sin obligatoriedad de crear contraseña previa.
- **Precios e impuestos:** Los precios exhibidos en el catálogo y listas de productos **incluyen IVA** para el consumidor final (precio a pagar transparente). En el carrito y checkout se desglosa el subtotal base y el IVA correspondiente para fines de comprobante y transparencia comercial.

---

## 2. Propuestas Iniciales (Para Aprobación Técnica y Funcional)

Las siguientes son propuestas basadas en los skills que se someten a validación:

1. **Gestión de Migraciones de Base de Datos:**
   - *Propuesta:* Utilizar **Flyway** integrado de forma nativa en Spring Boot con scripts SQL estructurados (`V1__...sql`, `V2__...sql`).
2. **Herramienta de Construcción Backend:**
   - *Propuesta:* **Maven** con su Maven Wrapper (`./mvnw` y `mvnw.cmd`), ampliamente compatible y con soporte estándar para plugins de dependencias y escaneo de vulnerabilidades (`owasp-dependency-check`).
3. **Mecanismo de Sesión y Autenticación:**
   - *Propuesta:* Tokens de sesión / refresh emitidos mediante cookies `HttpOnly`, `Secure`, `SameSite=Lax/Strict` junto con protección CSRF en endpoints mutables, evitando almacenar JWTs de larga duración en `localStorage`.
4. **Lotes y Fechas de Vencimiento:**
   - *Propuesta:* Para el rubro de cosmética e higiene, modelar a nivel de base de datos la trazabilidad de lote (`Lot`) y fecha de caducidad (`expirationDate`), pero implementarlo en dos fases: primero existencias globales por SKU, y luego refinamiento a selección por lote (estrategia FEFO: First Expired, First Out).
5. **Moneda Base:**
   - *Propuesta:* Pesos Colombianos (COP) o moneda local sin decimales fraccionarios en visualización, pero calculando internamente con precisión entera o decimal estricta (`BigDecimal`, escala 2).

---

## 3. Supuestos Temporales

Estos supuestos permiten avanzar en la arquitectura de la Fase 0 sin bloquear el diseño:

1. **Catálogo Inicial:** La tienda comenzará con una estructura simple de categorías (e.g., Cuidado Facial, Cuidado Capilar, Higiene Corporal, Maquillaje) con productos unitarios (SKU directo), dejando abiertas las variantes (e.g., tonos, tamaños) para una etapa posterior.
2. **Entorno de Datos:** Todos los datos de productos iniciales serán de demostración, con imágenes libres de derechos (Unsplash/Pexels con etiquetas claras) y textos descriptivos sintéticos.
3. **Pasarela de Pagos:** Se asumirá un adaptador simulado en el backend (`MockPaymentGatewayService`) que reproduzca fielmente el ciclo de vida real: `PENDIENTE` → `PROCESANDO` → `APROBADO`/`RECHAZADO`, además de webhooks con verificación de firma simétrica.
4. **Despliegue Demo:** Se asumirá frontend en Netlify o similar y backend contenerizado (Docker) en servicio PaaS/VPS con PostgreSQL gestionado.

---

## 4. Decisiones Pendientes (Requieren Acuerdo con el Usuario)

Para no asumir decisiones de negocio de forma arbitraria, se identifican las siguientes preguntas abiertas:

1. **Modalidad de Compra (Checkout):**
   - ¿Se permitirá la compra como usuario invitado (*Guest Checkout*) con solo ingresar correo y dirección, o será obligatorio registrarse/iniciar sesión antes de pagar?
2. **Manejo de Impuestos y Precios:**
   - ¿Los precios exhibidos en el catálogo incluyen IVA/impuestos (precio final consumidor), o se desglosan en el checkout?
3. **Reserva de Existencias (Stock Allocation):**
   - ¿En qué momento se descuenta/reserva el stock del inventario?
     - *Opción A:* Al agregar al carrito con tiempo de expiración (requiere proceso background que libere reservas expiradas).
     - *Opción B:* Al momento de generar el pedido pendiente de pago (con un tiempo de espera de p. ej. 15-30 minutos para confirmar pago).
     - *Opción C:* Únicamente tras la confirmación exitosa del pago (riesgo de vender sin existencias si dos usuarios pagan a la vez).
4. **Política de Envíos y Cobertura:**
   - ¿El costo de envío es fijo, calculado por ciudad/departamento, o gratuito a partir de cierto monto de compra?
5. **Roles de Usuario en el Sistema:**
   - ¿Se contemplan inicialmente solo dos roles (`ROLE_CUSTOMER` y `ROLE_ADMIN`) o se requiere un rol intermedio (`ROLE_STAFF` / Operador de Bodega) con permisos limitados sobre pedidos e inventario sin acceso a finanzas?
6. **Política de Devoluciones y Cancelaciones:**
   - ¿El cliente puede cancelar un pedido de forma autónoma mientras esté en estado `CREADO`/`PENDIENTE`? ¿Qué ocurre con productos de higiene una vez despachados?

---

## 5. Criterios de Aceptación Globales

Para certificar la finalización exitosa de las etapas del proyecto:

### 5.1 Criterios de Calidad de Código y Arquitectura
- [ ] Backend compila limpiamente con `./mvnw clean test` sin advertencias críticas ni tests omitidos/silenciados.
- [ ] Frontend compila limpiamente con `npm run build` y pasa `npm run lint` y `npm test` sin advertencias no justificadas.
- [ ] No existen credenciales, tokens, URLs de base de datos fijas ni secretos en el control de versiones.
- [ ] Todos los contratos HTTP expuestos están documentados mediante especificación OpenAPI accesible en local (`/swagger-ui/` o similar en dev).

### 5.2 Criterios de Seguridad y Datos
- [ ] Todo endpoint de cliente valida que el `customerId` autenticado corresponda al recurso solicitado (prevención BOLA/IDOR).
- [ ] Las operaciones de inventario están protegidas contra condiciones de carrera mediante transacciones y bloqueos de concurrencia (`Pessimistic Lock` o `Optimistic Lock` probado).
- [ ] Las notificaciones y cobros implementan verificación de firma e idempotencia (evitando duplicar pedidos o cargos).
- [ ] Auditoría de dependencias (`npm audit`, escaneo backend) realizada y sin alertas críticas desatendidas.

### 5.3 Criterios de Accesibilidad y Usabilidad
- [ ] La tienda pública es completamente navegable utilizando solo el teclado (indicador visual de foco evidente).
- [ ] Relación de contraste cumple WCAG 2.2 nivel AA (mínimo 4.5:1 para texto estándar).
- [ ] Todas las imágenes de productos cuentan con atributos `alt` descriptivos y útiles.
- [ ] Se implementan y muestran estados claros de carga (`skeleton`/`spinner`), vacío (`empty state`) y error (`error boundary`/mensajes asistidos).
