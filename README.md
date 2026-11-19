# Lúmina — Ecommerce de Cosméticos, Belleza e Higiene

Plataforma de comercio electrónico funcional, accesible, segura y transaccional, desarrollada para portafolio profesional con arquitectura de **Monolito Modular** y separación de responsabilidades entre cliente y servidor.

- **Nombre comercial provisional:** Lúmina (Fallback técnico: `Belleza Demo`)
- **Repositorio:** `ecommerce-cosmeticos`
- **Mercado base de prueba:** Cosméticos, cuidado facial, capilar e higiene corporal (precios en COP con IVA incluido).

---

## 1. Stack Tecnológico

### Frontend (`frontend/`)
- **Framework & Lenguaje:** React 18/19 con TypeScript en modo estricto (`strict: true`).
- **Herramienta de compilación:** Vite.
- **Enrutamiento:** React Router.
- **Estilos:** CSS moderno con tokens semánticos de diseño y soporte para modo claro/oscuro y `prefers-reduced-motion`.
- **Accesibilidad:** Diseñado bajo estándares WCAG 2.2 nivel AA (navegación por teclado, foco visible, contraste y atributos `alt`).
- **Pruebas:** Vitest y React Testing Library.

### Backend (`backend/`)
- **Lenguaje & Plataforma:** Java 21 LTS (OpenJDK Temurin).
- **Framework:** Spring Boot 3.3.x.
- **Seguridad:** Spring Security (RBAC, prevención IDOR/BOLA, hash adaptativo).
- **Persistencia:** Spring Data JPA / Hibernate con PostgreSQL.
- **Migraciones:** Flyway.
- **Validación:** Jakarta Bean Validation (`@Valid`).
- **Documentación de contratos:** OpenAPI 3 / Swagger.
- **Pruebas:** JUnit 5, Spring Boot Test y Testcontainers.
- **Herramienta de construcción:** Maven Wrapper (`./mvnw` y `mvnw.cmd`).

---

## 2. Estructura del Repositorio

> 📘 **Guía de Replicación para otros Negocios:** Consulta [`docs/blueprint-ecommerce-multiproposito.md`](docs/blueprint-ecommerce-multiproposito.md) para el manual maestro de arquitectura y pasos para clonar este ecommerce en cualquier otra actividad económica (moda, ferretería, tecnología, alimentos gourmet, etc.).

```text
ecommerce-cosmeticos/
├── docs/                               # Requisitos, arquitectura, guías de replicación
│   ├── blueprint-ecommerce-multiproposito.md # MANUAL MAESTRO DE REPLICACIÓN
│   └── requisitos-y-reglas-negocio.md
├── frontend/                           # Aplicación cliente React + Vite + TypeScript
│   ├── src/
│   │   ├── app/                        # Router y Providers
│   │   ├── components/                 # Componentes UI reutilizables y layout
│   │   ├── features/                   # Módulos por función (catalog, cart, checkout, auth)
│   │   ├── lib/                        # Cliente API, formateadores y validación
│   │   └── styles/                     # Variables de diseño y tokens CSS
│   └── package.json
├── backend/                            # API REST modular con Spring Boot 3
│   ├── src/main/java/com/lumina/       # Capas controller, service, domain, repository
│   ├── src/main/resources/             # Configuración y migraciones Flyway (SQL)
│   └── pom.xml                         # Dependencias Maven gestionadas
├── .gitignore
└── README.md
```

---

## 3. Requisitos Previos para Ejecución Local

1. **Node.js:** Versión 20 LTS o superior (verificado con Node v24).
2. **Java JDK:** Versión 21 LTS instalada y variable `JAVA_HOME` configurada.
3. **Git:** Para clonar y versionar el repositorio.
4. **Docker Desktop (Opcional pero recomendado):** Para levantar PostgreSQL en un contenedor local. Si Docker no está iniciado, el backend puede correr con la base en memoria H2 en perfil de prueba/desarrollo rápido.

---

## 4. Puesta en Marcha Rápida (Entorno Local)

### 4.1 Iniciar el Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

Para ejecutar las pruebas del frontend:
```bash
npm test
```

Para validar tipos y compilar el bundle de producción:
```bash
npm run build
```

### 4.2 Iniciar el Backend

```bash
cd backend
# En Windows:
.\mvnw.cmd spring-boot:run

# En Linux/macOS:
./mvnw spring-boot:run
```

La API REST iniciará en `http://localhost:8080`.
La documentación interactiva de OpenAPI / Swagger estará disponible en:
`http://localhost:8080/swagger-ui.html`

Para ejecutar las pruebas del backend:
```bash
.\mvnw.cmd test
```

---

## 5. Reglas de Negocio Clave

1. **Autoridad del Servidor:** El backend calcula subtotales, impuestos, cupones, stock y totales. No se confía en importes calculados en el navegador.
2. **Precios e IVA:** Los precios de catálogo tienen IVA incluido.
3. **Modalidad de Compra:** Se permite la compra tanto a usuarios registrados como a invitados (*Guest Checkout*).
4. **Líneas de Pedido Inmutables:** Los pedidos congelan una instantánea histórica de precio, nombre del producto, SKU e impuestos al momento de confirmar la compra.

---

## 6. Estado de Fases del Proyecto

- [x] **Fase 0:** Inspección, configuración de herramientas, requisitos y reglas de negocio.
- [ ] **Fase 1:** Fundamentos de frontend y backend, migraciones base y pruebas de arranque.
- [ ] **Fase 2:** Catálogo de productos, endpoints públicos y UI responsiva.
- [ ] **Fase 3:** Carrito, pedidos, pagos simulados e idempotencia.
- [ ] **Fase 4:** Panel administrativo, inventario por lotes y reportes de ventas.
- [ ] **Fase 5:** Estabilización, auditoría de seguridad y pruebas E2E.
- [ ] **Fase 6:** Preparación para despliegue de demo pública con datos ficticios.
