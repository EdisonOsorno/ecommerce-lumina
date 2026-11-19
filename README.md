# Lúmina — Ecommerce de Cosméticos, Belleza e Higiene

Plataforma de comercio electrónico funcional, accesible, segura y transaccional, desarrollada para portafolio profesional con arquitectura de **Monolito Modular** y separación estricta de responsabilidades entre cliente y servidor.

- **Nombre comercial provisional:** Lúmina (Fallback técnico: `Belleza Demo`)
- **Repositorio:** `ecommerce-lumina`
- **Mercado base de prueba:** Cosméticos, cuidado facial, capilar e higiene personal (precios en COP con IVA incluido).
- **Pruebas automáticas:** 48 pruebas en Backend (`JUnit 5 + MockMvc`) y 19 pruebas en Frontend (`Vitest`), todas en verde (100%).

---

## 1. Stack Tecnológico

### Frontend (`frontend/`)
- **Framework & Lenguaje:** React 18 con TypeScript en modo estricto (`strict: true`, `noUnusedLocals`).
- **Herramienta de compilación:** Vite.
- **Enrutamiento:** React Router (rutas públicas y protegidas por rol).
- **Estilos:** CSS moderno con variables semánticas de diseño y soporte para `prefers-reduced-motion`.
- **Accesibilidad:** Diseñado bajo estándares WCAG 2.2 nivel AA (navegación por teclado, foco visible, contraste y atributos `aria`).
- **Pruebas:** Vitest y React Testing Library.

### Backend (`backend/`)
- **Lenguaje & Plataforma:** Java 21 LTS (OpenJDK Temurin).
- **Framework:** Spring Boot 3.3.5.
- **Seguridad:** Spring Security con autenticación stateless JWT (HMAC-SHA256), roles `ROLE_CUSTOMER` y `ROLE_ADMIN`.
- **Persistencia:** Spring Data JPA / Hibernate con PostgreSQL (producción) y base en memoria H2 (desarrollo/test).
- **Migraciones de Esquema:** Flyway versionado (V1 a V6).
- **Validación:** Jakarta Bean Validation (`@Valid`).
- **Documentación de contratos:** OpenAPI 3 / Swagger UI interactivo.
- **Pruebas:** JUnit 5, Spring Boot Test y MockMvc.
- **Herramienta de construcción:** Maven Wrapper (`./mvnw` y `mvnw.cmd`).

---

## 2. Estructura del Repositorio

```text
ecommerce-lumina/
├── frontend/                           # Aplicación cliente React + Vite + TypeScript
│   ├── src/
│   │   ├── app/                        # Router y Providers
│   │   ├── components/                 # Componentes UI reutilizables y layout
│   │   ├── config/                     # Configuración central de marca (brand.ts)
│   │   ├── features/                   # Módulos por función (catalog, cart, checkout, auth, account, admin)
│   │   ├── lib/                        # Clientes API REST, formateadores y validación
│   │   └── types/                      # Contratos TypeScript espejos del backend
│   └── package.json
├── backend/                            # API REST modular con Spring Boot 3
│   ├── src/main/java/com/lumina/       # Capas controller, service, domain, repository
│   ├── src/main/resources/             # Configuración y migraciones Flyway (SQL)
│   └── pom.xml                         # Dependencias Maven gestionadas
├── .gitignore
└── README.md
```

---

## 3. Puesta en Marcha Rápida (Entorno Local)

Para ejecutar el proyecto en tu computador local no necesitas instalar bases de datos externas; el sistema incluye un perfil de desarrollo (`dev-h2`) que levanta la base de datos en memoria, ejecuta las migraciones automáticamente y crea el catálogo y usuario administrador de prueba.

### 3.1 Iniciar el Backend (Terminal 1)

```bash
cd backend

# En Windows (PowerShell / CMD):
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev-h2"

# En Linux / macOS:
./mvnw spring-boot:run "-Dspring-boot.run.profiles=dev-h2"
```

* La API REST iniciará en `http://localhost:8080`.
* La consola Swagger UI interactiva estará disponible en `http://localhost:8080/swagger-ui.html`.

Para correr los 48 tests del backend:
```bash
.\mvnw.cmd test
```

### 3.2 Iniciar el Frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

* La aplicación web estará lista en `http://localhost:5173`.

Para correr los tests del frontend o verificar la compilación TypeScript:
```bash
npm test
npm run build
```

---

## 4. Credenciales de Demostración para Pruebas

Para explorar todas las funcionalidades tanto de cliente como de backoffice, puedes utilizar las siguientes credenciales de prueba preconfiguradas:

### 🛡️ Acceso Administrador (Panel Backoffice)
* **Correo:** `admin@lumina.demo`
* **Contraseña:** `AdminLumina2026!`
* **Módulos habilitados:**
  * **Métricas & Analítica:** KPIs de ingresos netos, dinero perdido en cancelaciones/devoluciones, top productos estrella y productos de baja rotación.
  * **Control de Inventario:** Niveles de stock en tiempo real, alertas de agotado y modal de ajuste manual con auditoría Kardex.
  * **Gestión de Pedidos:** Visualización de ventas, cambio de estados (Pendiente, Pagado, Enviado, Entregado, Cancelado, Reembolsado) y comprobantes.
  * **Gestor de Productos:** Creación y edición de productos con subida de fotos locales (JPG, PNG, WebP) o URL externa, y soft-delete (`is_active`).

### 👤 Acceso Cliente (Tienda y Cuenta)
* **Registro libre:** Puedes registrar una cuenta con cualquier correo desde `/cuenta/registro`, o comprar directamente como **invitado** (*Guest Checkout*).
* **Módulos habilitados:**
  * Catálogo interactivo con filtros por categoría y desglose de IVA (19%).
  * Carrito de compras con persistencia y control de unidades disponibles.
  * Checkout y generación de comprobante de compra.
  * Menú desplegable de usuario: **Mi Perfil** (actualización de datos y cambio de clave) y **Mis Pedidos** (historial con protección IDOR).
  * Recuperación de contraseña en caso de olvido (`/cuenta/recuperar-password`).

---

## 5. Reglas de Negocio y Seguridad Implementadas

1. **Autoridad Absoluta del Servidor:** El backend calcula subtotales, impuestos, cupones, flete y totales. El frontend nunca envía precios finales de confianza.
2. **Bloqueo Pesimista de Inventario:** Uso de `PESSIMISTIC_WRITE` para evitar sobreventas concurrentes cuando dos clientes compran simultáneamente el último producto.
3. **Protección IDOR (Insecure Direct Object Reference):** Un cliente únicamente puede consultar sus propios pedidos; el backend verifica la propiedad del recurso contra el token JWT autenticado.
4. **Soft Delete Comercial:** Los productos nunca se eliminan físicamente de la base de datos (`is_active = FALSE`), preservando la integridad histórica y contable de los pedidos ya facturados.
5. **Anti-Enumeración de Cuentas:** La recuperación de contraseña responde con un mensaje neutro exista o no el correo ingresado.

---

## 6. Estado de Fases del Proyecto

- [x] **Fase 0:** Inspección, arquitectura monolítica modular, requisitos y estándares de seguridad.
- [x] **Fase 1:** Configuración base, wrappers de construcción, estándares Git y migraciones iniciales.
- [x] **Fase 2:** Catálogo comercial con filtros de categoría, vista de producto y desglose de IVA.
- [x] **Fase 3:** Carrito con persistencia, autenticación JWT, checkout y regla de flete gratis (≥ $100.000 COP).
- [x] **Fase 4:** Historial de compras autenticado (*Mis Pedidos*) con blindaje de privacidad IDOR.
- [x] **Fase 5:** Backoffice integral:
  - [x] Semillero automático y rescate de administrador.
  - [x] Gestión y actualización de estados de pedidos.
  - [x] Ajustes de inventario en tiempo real con auditoría.
  - [x] CRUD de productos con carga multipart de imágenes desde el computador.
  - [x] Menú de usuario desplegable y pantalla *Mi Perfil* con cambio de clave seguro.
  - [x] Flujo de recuperación de contraseñas olvidadas con tokens de 15 minutos.
  - [x] Dashboard de Métricas y Analítica comercial con sugerencias de abastecimiento.
- [ ] **Fase 6:** Empaquetado final Docker Compose (PostgreSQL + Backend + Frontend) para despliegue en un solo clic.
