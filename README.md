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
