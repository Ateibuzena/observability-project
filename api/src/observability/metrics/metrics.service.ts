/*Métricas Prometheus*/

import { Injectable } from '@nestjs/common';
import { Registry, collectDefaultMetrics, Histogram } from 'prom-client';

@Injectable()
export class MetricsService {
    private readonly registry: Registry;
    public httpRequestDuration: Histogram<string>;

    constructor() {
        this.registry = new Registry();
        collectDefaultMetrics({ register: this.registry });

        this.httpRequestDuration = new Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.registry],
        });
    }

    getMetrics(): Promise<string> {
        return this.registry.metrics();
    }
}