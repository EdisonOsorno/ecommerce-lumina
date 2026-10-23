# Registro de Auditoría de Dependencias y Seguridad

**Proyecto:** Lúmina (`ecommerce-cosmeticos`)  
**Fecha de revisión:** 22 de octubre de 2026  
**Fuentes oficiales consultadas:**
- GitHub Advisory Database (`github.com/advisories`)
- npm Security Advisories (`registry.npmjs.org/-/npm/v1/security/advisories`)
- Spring Security Advisories (`spring.io/security`)
- PostgreSQL Security Releases (`postgresql.org/support/security`)

---

## 1. Resumen de Auditoría Frontend (`npm audit`)

| Paquete afectado | Severidad | CVE / Advisory | Tipo de Riesgo | Estado & Mitigación |
| :--- | :--- | :--- | :--- | :--- |
| `tinypool` (vía `vitest` < 5) | Crítica | GHSA-5gmw-xhrv-c9v3 / GHSA-85c8-ppgw-ccpr | Prototype Pollution en worker options | Resuelto al actualizar a las versiones parcheadas de Vitest en el lockfile. |
| `esbuild` (vía `vite` < 6.4.3) | Moderada | GHSA-67mh-4wv8-2f99 | Acceso de sitios web al dev server | Mitigado en desarrollo local y resuelto al actualizar Vite. No afecta el bundle de producción compilado. |
| `react-router` / `react-router-dom` (< 7.18) | Moderada | GHSA-wrjc-x8rr-h8h6 | Open redirect con barra invertida en `<Link>` | Actualizado a versión parcheada `^7.18` con retrocompatibilidad. |
| `@vitest/mocker` | Moderada | GHSA-82fw-gwwq-j7x9 | Path traversal en mocking | Resuelto al actualizar el stack de pruebas. |

---

## 2. Resumen de Auditoría Backend (Java / Spring Boot)

- **Java Runtime:** Eclipse Temurin OpenJDK `21.0.12.1+1 LTS` (compilador `javac 21.0.12.1`).
- **Spring Boot:** `3.3.5` (incluye Spring Framework 6.1.14 y Spring Security 6.3.4 con parches acumulativos contra denegación de servicio y autorización de rutas).
- **PostgreSQL JDBC:** `42.7.4` (sin vulnerabilidades críticas abiertas).
- **Flyway:** `10.10.x` (migraciones versionadas estándar).
- **SpringDoc OpenAPI:** `2.6.0` (Swagger UI actualizado con protección contra XSS en interfaz editorial).

---

## 3. Política Continua de Seguridad
1. Se mantiene el archivo de bloqueo `package-lock.json` para builds deterministas.
2. Ningún secreto, token ni credencial se almacena en el control de versiones.
3. Se ejecutarán escaneos automáticos de dependencias antes de cada entrega de fase.
