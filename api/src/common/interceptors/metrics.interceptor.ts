/*Interceptor (medición real)*/
/*Lo que sí es un riesgo: si alguna vez etiquetas con req.body.userId o req.query.email → estarías exponiendo datos de usuarios a Prometheus. Etiquetas deben ser información segura y agregada, nunca datos individuales identificables.*/

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../observability/metrics/metrics.service';
import { log } from 'console';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const start = Date.now();
        const request = context.switchToHttp().getRequest();
        const method = request.method;
        const route = request.route?.path || request.url;

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const statusCode = response.statusCode;
                const duration = (Date.now() - start) / 1000;

                this.metrics.httpRequestDuration
                    .labels(method, route, statusCode.toString())
                    .observe(duration);
                    
                this.metrics.incrementRequests(method, route, statusCode.toString());
                void this.metrics.getTotalRequests().then((totalRequests) => {
                    log(`Request ${method} ${route} completed with status ${statusCode} in ${duration}ms total requests: ${totalRequests}`);
                });
                this.metrics.setActiveUsers(1); // Ejemplo: incrementar usuarios activos (en un caso real, esto debería basarse en la lógica de conexión/desconexión de usuarios)
            })
        );
    }
}