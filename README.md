# 🧱 FASE 0 — Preparar proyecto

```bash
mkdir observability-project
cd observability-project
```

---

# 🧱 FASE 1 — NestJS + TypeScript (limpio, local, sin sudo)

Evita global installs:

```bash
npm install @nestjs/cli --save-dev
npx nest new api
```

Selecciona `npm` cuando pregunte.
Resultado:

```
observability-project/
└── api/
```

---

# 🧱 FASE 2 — Dependencias clave

Dentro de `api/`:

```bash
npm install pino pino-http nestjs-pino prom-client
```

* `pino` → logs estructurados
* `prom-client` → métricas Prometheus

Esto es **lo mínimo viable** para observabilidad.

---

# 🧱 FASE 3 — Estructura de proyecto real

Dentro de `src/`:

```bash
mkdir observability
mkdir observability/logging
mkdir observability/metrics
mkdir common
mkdir common/interceptors
```

Olvídate de la estructura default de NestJS: no sirve para sistemas observables serios.

---

# 🧱 FASE 4 — Logging

### `src/observability/logging/logger.module.ts`

```ts
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: { transport: { target: 'pino-pretty' } }, // quitar en prod
    }),
  ],
})
export class AppLoggerModule {}
```

### `src/observability/logging/logger.service.ts`

```ts
import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class AppLogger implements LoggerService {
  private logger = pino();

  log(message: string) { this.logger.info(message); }
  error(message: string, trace?: string) { this.logger.error({ trace }, message); }
  warn(message: string) { this.logger.warn(message); }
  debug(message: string) { this.logger.debug(message); }
}
```

Esto **es la base**: logs estructurados y consistentes desde el día uno.

---

# 🧱 FASE 5 — Métricas Prometheus

### `src/observability/metrics/metrics.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  public httpRequestDuration: Histogram<string>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duración de requests HTTP',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
  }

  getMetrics() { return this.registry.metrics(); }
}
```

### `metrics.module.ts`

```ts
import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
```

---

# 🧱 FASE 6 — Interceptor (medición real)

`src/common/interceptors/metrics.interceptor.ts`:

```ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from '../../observability/metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const route = req.route?.path || req.url;

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const status = res.statusCode;
        const duration = (Date.now() - start) / 1000;

        this.metrics.httpRequestDuration
          .labels(method, route, status.toString())
          .observe(duration);
      }),
    );
  }
}
```

---

# 🧱 FASE 7 — Endpoint `/metrics`

En `app.controller.ts`:

```ts
import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './observability/metrics/metrics.service';

@Controller()
export class AppController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  async getMetrics(@Res() res) {
    res.set('Content-Type', 'text/plain');
    res.send(await this.metrics.getMetrics());
  }

  @Get('test')
  test() { return { message: 'ok' }; }
}
```

---

# 🧱 FASE 8 — Conectar módulos

`app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MetricsModule } from './observability/metrics/metrics.module';
import { AppLoggerModule } from './observability/logging/logger.module';

@Module({
  imports: [MetricsModule, AppLoggerModule],
  controllers: [AppController],
})
export class AppModule {}
```

---

# 🧱 FASE 9 — Activar interceptor global

`main.ts`:

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './observability/metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));
  await app.listen(3000);
}
bootstrap();
```

---

# 🧱 FASE 10 — Probar

```bash
npm run start:dev
```

Visita:

```
http://localhost:3000/test
http://localhost:3000/metrics
```

Si no ves métricas → estás fallando en lo básico.

---

# 🧱 FASE 11 — Docker mínimo

`observability-project/docker-compose.yml`:

```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
```

`observability-project/docker/prometheus.yml`:

```yaml
global:
  scrape_interval: 5s
scrape_configs:
  - job_name: 'nestjs_app'
    static_configs:
      - targets: ['host.docker.internal:3000']
```

Perfecto. Lo que estás a punto de hacer es la parte **realmente seria** de observabilidad: métricas centralizadas y logging con ELK. Te voy a dar una guía **estricta y detallada**, fase por fase, siguiendo tu estilo de proyecto. Esto no es un “tutorial de copy-paste”: cada paso tiene que estar exacto, porque vas a indexar logs y métricas para poder **consultarlos y alertarlos**.

---

# 🧱 FASE 12 — Prometheus métricas avanzadas

Ya tienes métricas básicas, pero vamos a exponer **métricas custom + etiquetas útiles** para Grafana.

Dentro de `src/observability/metrics/metrics.service.ts` añade:

```ts
import { Counter, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  public httpRequestDuration: Histogram<string>;
  public activeUsers: Gauge<string>;
  public requestCount: Counter<string>;

  constructor() {
    collectDefaultMetrics({ register: this.registry });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duración de requests HTTP',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.activeUsers = new Gauge({
      name: 'active_users',
      help: 'Usuarios activos conectados',
      registers: [this.registry],
    });

    this.requestCount = new Counter({
      name: 'request_count_total',
      help: 'Número total de requests HTTP',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
  }

  incrementRequests(method: string, route: string, status: string) {
    this.requestCount.labels(method, route, status).inc();
  }

  setActiveUsers(count: number) {
    this.activeUsers.set(count);
  }

  getMetrics() {
    return this.registry.metrics();
  }
}
```

En tu `MetricsInterceptor` añade:

```ts
this.metrics.incrementRequests(method, route, status.toString());
```

Así cada request queda **contabilizada + duración**.

---

# 🧱 FASE 13 — Grafana dashboard básico

Vamos a crear un dashboard mínimo para tu app NestJS:

1. Inicia Grafana (ya está en tu docker-compose).

2. Login: `admin/admin`.

3. Añade Prometheus como **Data Source**:

   * URL: `http://prometheus:9090`
   * Access: `Server`
   * Save & Test → OK

4. Crear un dashboard:

   * Panel 1: `http_request_duration_seconds` → tipo **Graph**
     *Visualiza duración por ruta y método.*
   * Panel 2: `request_count_total` → tipo **Stat**
     *Muestra total requests.*
   * Panel 3: `active_users` → tipo **Gauge**

Guarda dashboard → `dashboard.json` si quieres versionarlo.

---

# 🧱 FASE 14 — ELK stack mínimo

Vamos a levantar ELK con Docker y conectarlo a tu app NestJS.

`docker-compose.yml` añade:

```yaml
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.1
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.1
    ports:
      - "5601:5601"
    environment:
      ELASTICSEARCH_HOSTS: "http://elasticsearch:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.1
    volumes:
      - ./docker/logstash/pipeline/:/usr/share/logstash/pipeline/
    ports:
      - "5044:5044"
```

Crea `docker/logstash/pipeline/logstash.conf`:

```conf
input {
  tcp {
    port => 5044
    codec => json_lines
  }
}

filter {
  # opcional: parsea fields
  mutate {
    convert => { "statusCode" => "integer" }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "nestjs-logs-%{+YYYY.MM.dd}"
  }
  stdout { codec => rubydebug }
}
```

---

# 🧱 FASE 15 — Enviar logs desde NestJS a Logstash

Instala:

```bash
npm install pino-elasticsearch @nestjs/terminus
```

Modifica `logger.service.ts`:

```ts
import pinoElastic from 'pino-elasticsearch';

const stream = pinoElastic({
  node: 'http://localhost:5044', // Logstash TCP
  index: 'nestjs-logs'
});

private logger = pino({ level: 'info' }, stream);
```

Ahora tus logs están **indexados en Elasticsearch** automáticamente.

---

# 🧱 FASE 16 — Queries básicas en Kibana

1. Accede a `http://localhost:5601`.
2. Crea **Index Pattern**: `nestjs-logs-*`.
3. Explora logs:

```kql
statusCode: 500
method: "POST"
route: "/test"
```

4. Puedes crear dashboards en Kibana similares a Grafana, pero sobre **logs**.

---

# 🧱 FASE 17 — Validación rápida

* Prometheus: `http://localhost:9090/graph?g0.expr=http_request_duration_seconds`
* Grafana: `http://localhost:3001` → paneles OK
* Kibana: `http://localhost:5601` → logs visibles
* NestJS app: `http://localhost:3000/test` → logs + métricas actualizadas

---

