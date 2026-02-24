## 1️⃣ Qué he hecho

1. **Inicialización de un proyecto NestJS con TypeScript**

   * `npx nest new api`
   * He creado la base de un backend modular, con TypeScript y controladores, listo para crecer.
   * NestJS ya te fuerza a pensar en **modularidad y dependencias**, algo crítico para sistemas observables.

2. **Instalación de dependencias clave para observabilidad**

   * `pino` → logging estructurado
   * `prom-client` → métricas Prometheus
   * `nestjs-pino` → integración de logging con NestJS
     Elegí **herramientas reales de producción**, no mocks ni paquetes de ejemplo.

3. **Creación de un módulo de logging (`logger.module.ts` y `logger.service.ts`)**

   * Ahora tengo **logs estructurados y consistentes** desde el primer request.
   * Esto significa que cada error, advertencia o info ya puede ser procesado por un sistema central como ELK.

4. **Creación de un módulo de métricas (`metrics.service.ts`)**

   * Recolecta **métricas estándar** (`collectDefaultMetrics`) y métricas personalizadas (`http_request_duration_seconds`).
   * Es el paso donde NestJS deja de ser “un API” y empieza a ser **observado en tiempo real**.

5. **Interceptor global para medir duración de requests**

   * Cada request que pasa por mi API ahora deja una huella: método, ruta, status y tiempo.
   * Esto es exactamente lo que Prometheus necesita para graficar dashboards de rendimiento.

6. **Exposición del endpoint `/metrics`**

   * Permite que Prometheus scrapee mi API y recoja todas las métricas automáticamente.
   * También me da un feedback directo: si visitas `/metrics` veo mi sistema “hablando en métricas”.

7. **Conexión de módulos en `AppModule` y activación del interceptor en `main.ts`**

   * He unido todo: logging + métricas + interceptores + endpoints.
   * Mi app ahora está instrumentada y lista para ser **observada por sistemas externos** como Prometheus o ELK.

8. **Prueba local (`npm run start:dev`)**

   * Validé que la instrumentación funciona: `/test` funciona y `/metrics` te da métricas.
   * Esto cierra el ciclo: **instrumentación → exposición → validación local**.

---

## 2️⃣ Qué he aprendido

1. **No puedo aprender observabilidad si no entiendo primero la base**:

   * Logs y métricas son la columna vertebral.
   * Sin esto, no importa si conecto Prometheus o ELK; no tendré datos útiles.

2. **Cómo estructurar un proyecto observable desde cero**:

   * NestJS por defecto no está pensado para esto, y rompí la estructura default.
   * Separé `observability` de `common` y `modules`, que es **lo que hacen los equipos serios**.

3. **Cómo medir y exponer métricas HTTP reales**:

   * No solo creé un contador: hice un **histograma con labels dinámicos**.
   * Esto es exactamente lo que usan las empresas para monitorizar latencia, errores y carga.

4. **El patrón de interceptores para cross-cutting concerns**:

   * Aprendí cómo “inyectar” lógica en **todas las requests** sin tocar cada controlador.
   * Esto es clave para logging, métricas, tracing y seguridad.

5. **Qué significa que un sistema sea observable de verdad**:

   * Cada request deja **logs y métricas**.
   * La observabilidad no es instalar Prometheus, es **instrumentar el código para que sea mensurable y trazable**.
