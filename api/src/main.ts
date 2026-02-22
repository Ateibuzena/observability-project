/*Activar interceptor global*/

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MetricsInterceptor } from './common/interceptors/metrics.interceptor';
import { MetricsService } from './observability/metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const metricsService = app.get(MetricsService);
  app.useGlobalInterceptors(new MetricsInterceptor(metricsService));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
