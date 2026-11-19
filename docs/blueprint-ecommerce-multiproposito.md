# Guía Maestra y Blueprint de Arquitectura: Comercio Electrónico Multiproósito
**Plataforma de E-Commerce Monolítica Modular de Alto Rendimiento**

> **Propósito de este documento:**  
> Servir como manual de referencia, directrices técnicas y guía paso a paso para clonar, adaptar y desplegar esta arquitectura en **cualquier actividad económica o modelo de negocio** (ropa/moda, ferretería, tecnología, supermercado gourmet, repuestos automotrices, farmacia, etc.), conservando los más altos estándares de seguridad, transaccionalidad, auditoría y experiencia de usuario.

---

## 1. Filosofía de Diseño y Principios Rectores

El sistema fue concebido bajo el principio de **"Separación de Responsabilidades y Autoridad Absoluta del Servidor"**:

1. **El Backend es la única autoridad de negocio:**  
   El cliente (frontend) es únicamente una interfaz de presentación y captura de intención. Precios, impuestos (IVA), cálculo de totales, costo de flete, validación de inventario y transiciones de estado ocurren **única y exclusivamente en el servidor**. Nunca se confía en montos o descuentos enviados por el navegador.
2. **Monolito Modular:**  
   En lugar de la complejidad prematura de microservicios, el backend está organizado en módulos funcionales de bajo acoplamiento y alta cohesión (`auth`, `users`, `catalog`, `inventory`, `orders`, `admin`). Esto permite escalabilidad vertical sencilla, despliegues atómicos y transacciones de base de datos seguras (`ACID`).
3. **Seguridad Stateless y Roles Estrictos:**  
   Autenticación basada en JSON Web Tokens (JWT) sin estado en memoria del servidor. Roles jerárquicos claros: `ROLE_CUSTOMER` (compras, historial propio, perfil) y `ROLE_ADMIN` (gestión de catálogo, ajustes de inventario, cambio de estados, métricas comerciales).
4. **Transaccionalidad e Idempotencia:**  
   Uso de **bloqueo pesimista (`PESSIMISTIC_WRITE`)** en la reserva de stock para impedir la sobreventa (*overselling*) cuando múltiples usuarios intentan comprar la última unidad al mismo milisegundo.
5. **Precisión Financiera:**  
   Todos los cálculos monetarios utilizan de forma estricta `BigDecimal` en Java y tipos `NUMERIC(12, 2)` en base de datos. Está estrictamente prohibido el uso de `float` o `double` para dinero.

---

## 2. Diagrama de Arquitectura Global

```
+-----------------------------------------------------------------------+
|                             NAVEGADOR / CLIENTE                       |
|   React 18 + TypeScript Estricto + Vite + CSS Tokens de Marca         |
+-----------------------------------------------------------------------+
                                    |
                 Peticiones HTTPS / JSON (REST) + Bearer JWT
                                    |
                                    v
+-----------------------------------------------------------------------+
|                      BACKEND: SPRING BOOT 3.3.5 (JAVA 21)             |
|                                                                       |
|  [Security Filter Chain] -> JwtAuthenticationFilter (Stateless)       |
|                                                                       |
|  [Módulos REST]:                                                      |
|   ├── /api/auth/**      -> Registro, Login, Recuperación (Público)    |
|   ├── /api/catalog/**   -> Catálogo, Productos, Categorías (Público)  |
|   ├── /api/orders/**    -> Creación Pedidos (Invitado/Autenticado)    |
|   ├── /api/users/me/**  -> Perfil, Cambio Clave (Autenticado)         |
|   └── /api/admin/**     -> Backoffice, Inventario, Métricas (ADMIN)   |
|                                                                       |
|  [Capa de Servicios y Dominio Transaccional (@Transactional)]         |
|   ├── Bloqueo Pesimista (Stock)  |  Kardex de Movimientos             |
|   ├── Anti-Enumeración Auth      |  Cálculo de Impuestos y Fletes     |
|                                                                       |
|  [Manejador Global de Errores RFC 7807 (ProblemDetail)]               |
+-----------------------------------------------------------------------+
                                    |
                     JPA / Hibernate / JDBC Pools
                                    |
                                    v
+-----------------------------------------------------------------------+
|                 BASE DE DATOS VERSIONADA (FLYWAY MIGRATIONS)          |
|                                                                       |
|   PostgreSQL (Producción) / H2 in-memory (Desarrollo y Testing)       |
|   Restricciones: NOT NULL, CHECK, UNIQUE, FOREIGN KEY CASCADE         |
+-----------------------------------------------------------------------+
```

---

## 3. Estructura del Código y Responsabilidades

### 3.1 Backend (`backend/src/main/java/com/lumina/`)

```text
com.lumina/
├── LuminaApplication.java            # Punto de entrada Spring Boot
├── config/
│   ├── SecurityConfig.java           # Reglas de autorización URL y bean AuthenticationManager
│   ├── WebConfig.java                # Exposición estática segura de /uploads/** y CORS
│   └── GlobalExceptionHandler.java   # Mapeo unificado de excepciones a RFC 7807 ProblemDetail
├── shared/
│   └── errors/                       # Excepciones de dominio (ResourceNotFound, InsufficientStock...)
├── auth/
│   ├── controller/AuthController.java# /api/auth/register, /login, /forgot-password, /reset-password
│   ├── domain/PasswordResetToken.java# Entidad de tokens de recuperación (TTL 15 min, un solo uso)
│   ├── dto/                          # Records inmutables para peticiones y respuestas
│   ├── repository/                   # Spring Data JPA interfaces
│   ├── security/                     # JwtService, JwtAuthenticationFilter
│   └── service/                      # AuthService y PasswordResetService
├── users/
│   ├── controller/UserController.java# /api/users/me (perfil y cambio de clave con BCrypt)
│   ├── domain/User.java              # Entidad usuario (email único, rol, hash de contraseña)
│   ├── repository/UserRepository.java# findByEmailIgnoreCase, etc.
│   └── service/                      # UserService y AdminUserInitializer (semilla automática)
├── catalog/
│   ├── controller/CatalogController.java # /api/catalog/products, /categories (público)
│   ├── domain/                       # Category, Product (slug, sku, vatRate, compareAtPrice)
│   └── service/CatalogService.java   # Búsquedas, filtros y ordenamiento
├── inventory/
│   ├── domain/                       # InventoryItem (disponible, reservado), StockMovement (Kardex)
│   └── repository/                   # Bloqueo pesimista findByProductIdWithLock
├── orders/
│   ├── controller/OrderController.java # /api/orders (compra invitado/cliente, /my-orders con IDOR)
│   ├── domain/                       # Order (6 estados), OrderItem (snapshot de compra)
│   └── service/OrderService.java     # Reserva atómica de stock, reglas de envío y cálculo de IVA
└── admin/
    ├── catalog/AdminProductController.java # CRUD de productos, soft delete (is_active)
    ├── inventory/AdminInventoryController.java # Ajustes manuales de bodega con auditoría
    ├── metrics/AdminMetricsController.java # KPIs financieros, más vendidos y productos estancados
    ├── orders/AdminOrderController.java    # Listado admin, filtro por estado y actualización
    └── upload/AdminUploadController.java   # Subida multipart de imágenes (JPG/PNG/WebP, anti-traversal)
```

### 3.2 Frontend (`frontend/src/`)

```text
src/
├── app/
│   └── router/index.tsx             # Enrutamiento React Router con rutas públicas y protegidas
├── config/
│   └── brand.ts                     # IDENTIDAD CENTRAL: nombre de marca, logos, moneda, redes
├── components/
│   ├── layout/                      # Navbar (con dropdown de usuario), Footer, MainLayout
│   └── ui/                          # Componentes atómicos (Button, Alert, Badge, Modal, Input)
├── features/
│   ├── auth/                        # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   ├── account/                     # ProfilePage (/cuenta/perfil), MyOrdersPage (/cuenta/pedidos)
│   ├── admin/                       # AdminPage (/admin) con 4 pestañas: Pedidos, Stock, Productos, Métricas
│   ├── catalog/                     # CatalogPage (filtros), ProductDetailPage (desglose IVA)
│   ├── cart/                        # CartContext (sessionStorage), CartPage
│   ├── checkout/                    # CheckoutPage, OrderConfirmationPage (comprobante)
│   └── home/                        # HomePage (hero banner, destacados, testimonios)
├── lib/
│   ├── api/                         # Clientes fetch modulares (auth, user, catalog, orders, admin)
│   └── formatting/currency.ts       # Formateo consistente de moneda según la actividad comercial
└── types/                           # Contratos TypeScript espejos de los DTOs Java
```

---

## 4. Guía Paso a Paso para Adaptar el Proyecto a Otra Actividad Económica

Para transformar esta tienda a otro sector (por ejemplo, **Ferretería Industrial**, **Moda/Ropa**, **Librería** o **Alimentos Gourmet**), sigue este procedimiento ordenado:

### Paso 1: Configurar la Identidad de Marca (Frontend)
Edita el archivo central `frontend/src/config/brand.ts`:
```ts
export const BRAND = {
  name: 'Herramientas Pro', // Nombre de la nueva empresa
  tagline: 'Equipos y suministros para la industria y construcción',
  contactEmail: 'contacto@herramientaspro.demo',
  contactPhone: '+57 (601) 555-0199',
  address: 'Zona Industrial Calle 13 # 68-20, Bogotá, Colombia',
  currency: 'COP', // Moneda comercial
  defaultProductImage: '...', // SVG o imagen de respaldo para productos sin foto
  social: {
    instagram: 'https://instagram.com/...',
    whatsapp: 'https://wa.me/...',
  },
};
```
*Actualiza los colores y tokens visuales en `frontend/src/styles/tokens.css` (colores primarios, secundarios y acentos correspondientes al nicho).*

### Paso 2: Adaptar las Categorías y Productos Semilla (Base de Datos)
El esquema de datos admite cualquier categoría y producto. Edita la migración Flyway de datos iniciales (`backend/src/main/resources/db/migration/V2__seed_demo_catalog.sql`):
1. **Categorías:**
   ```sql
   INSERT INTO categories (name, slug, description) VALUES
   ('Herramientas Eléctricas', 'herramientas-electricas', 'Taladros, pulidoras y sierras de alto rendimiento'),
   ('Seguridad Industrial', 'seguridad-industrial', 'Cascos, guantes certificados y protección auditiva'),
   ('Fijaciones y Tornillería', 'fijaciones-tornilleria', 'Pernos, anclajes y tornillos estructurales');
   ```
2. **Productos con sus SKUs comerciales:**
   ```sql
   INSERT INTO products (category_id, name, slug, sku, description, price, compare_at_price, vat_rate, image_url, is_active)
   VALUES
   (1, 'Taladro Percutor 1/2" 750W', 'taladro-percutor-750w', 'FER-HER-001', 'Motor potente con velocidad variable', 289900.00, 320000.00, 0.19, '/uploads/products/taladro.jpg', TRUE);
   ```

### Paso 3: Reglas de Impuestos y Fletes (Reglas de Negocio)
Cada actividad comercial puede tener reglas tributarias y de logística distintas:
1. **Tasa de Impuesto (`vatRate`):**
   * Configurable por producto: Si vendes alimentos básicos no gravados, usa `vat_rate = 0.00`; para productos gravados con tarifa general, usa `0.19` (o la tasa de tu país, ej. `0.16` en México o `0.21` en España).
2. **Umbral de Envío Gratis:**
   * En `backend/src/main/java/com/lumina/orders/service/OrderService.java` y en `frontend/src/features/cart/CartPage.tsx`:
   * Modifica las constantes comerciales:
     ```java
     private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("150000.00"); // Envío gratis a partir de este monto
     private static final BigDecimal STANDARD_SHIPPING_COST = new BigDecimal("15000.00");   // Costo si es menor
     ```

### Paso 4: Ajustar la Demanda de Stock (Dashboard Analítico)
En `backend/src/main/java/com/lumina/admin/metrics/service/AdminMetricsService.java`:
* Si el nuevo negocio vende productos de alta rotación (ej. supermercado), el umbral de baja rotación puede ser de 10 o 20 unidades.
* Si vende productos de alto valor unitario (ej. joyas, maquinaria), el umbral de baja rotación puede ser 1 o 2 unidades.
* Se ajusta en la constante:
  ```java
  private static final long LOW_DEMAND_MAX_UNITS_SOLD = 5;
  ```

---

## 5. Matriz de Seguridad y Reglas Técnicas Obligatorias

| Área | Regla Técnica Implementada | Justificación / Riesgo Mitigado |
| :--- | :--- | :--- |
| **Autenticación** | JWT con HMAC-SHA256 y expiración; stateless | No consume memoria en servidor; escala horizontalmente. |
| **Contraseñas** | BCrypt con factor de costo 12 | Protege contra ataques de diccionario y tablas rainbow. |
| **Acceso a Pedidos (IDOR)** | El servicio verifica que `order.user_id == authenticatedUser.id` | Impide que un usuario acceda a compras de otros clientes cambiando el número en la URL. |
| **Concurrencia de Stock** | `SELECT ... FOR UPDATE` (`LockModeType.PESSIMISTIC_WRITE`) | Evita la sobreventa cuando dos usuarios pagan simultáneamente la última unidad. |
| **Eliminación de Productos** | Soft delete (`is_active = FALSE`) | **Nunca `DELETE` físico**. Preserva la integridad referencial histórica para auditorías e impuestos. |
| **Subida de Archivos** | Whitelist MIME (`jpg`, `png`, `webp`), UUID aleatorio y path traversal check (`getFileName()`) | Evita ejecución remota de código y sobreescritura maliciosa de archivos en el servidor. |
| **Recuperación Clave** | Tokens únicos con caducidad (15 min) y un solo uso (`used = TRUE`) | Impide ataques de reutilización de enlaces antiguos. |
| **Anti-Enumeración** | La API responde 200 OK con mensaje neutro exista o no el email | Evita que atacantes deduzcan qué personas están registradas en la tienda. |

---

## 6. Comandos Operativos y Mantenimiento

### 6.1 Ejecución en Entorno de Desarrollo (Local)

**Terminal 1 — Backend (Spring Boot con H2 in-memory):**
```powershell
# Configurar JAVA_HOME a tu instalación local de JDK 21 si no está en el PATH
# $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21..."
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev-h2"
```

**Terminal 2 — Frontend (Vite Dev Server):**
```powershell
cd frontend
npm.cmd run dev
```

### 6.2 Verificación de Calidad y Pruebas Automatizadas

**Backend (JUnit 5 + MockMvc + Flyway):**
```powershell
cd backend
.\mvnw.cmd test
```
*Resultado esperado: **48 tests pasando al 100%**.*

**Frontend (Vitest + TypeScript Estricto):**
```powershell
cd frontend
npm.cmd test -- --run
npm.cmd run build
```
*Resultado esperado: **19 tests pasando al 100% y 0 errores en `tsc -b`**.*

### 6.3 Liberación de Puertos Bloqueados
Si alguna vez se interrumpe abruptamente la ejecución y el puerto 8080 queda ocupado:
```powershell
Get-Process -Name java, node -ErrorAction SilentlyContinue | Stop-Process -Force
```

---

## 7. Checklist de Lanzamiento para un Nuevo Negocio

Antes de poner en producción una nueva tienda basada en este blueprint:

- [ ] **Marca:** Reemplazado nombre, logo y redes en `brand.ts`.
- [ ] **Catálogo:** Definidas las categorías y productos representativos en la migración `V2`.
- [ ] **Impuestos:** Verificada la tasa de IVA aplicable según la legislación del país.
- [ ] **Reglas de Envío:** Ajustado el valor mínimo para envío gratuito.
- [ ] **Credenciales Admin:** Modificada la clave del administrador por defecto en variables de entorno (`ADMIN_PASSWORD`).
- [ ] **Persistencia:** Configurada la cadena de conexión de producción a PostgreSQL en `application.yml`.
- [ ] **Imágenes:** Directorio `./uploads/products/` creado y con permisos adecuados de lectura/escritura.
- [ ] **Pruebas:** Ejecutada la suite completa de pruebas (`mvnw test` y `npm test`) con resultado 100% en verde.
