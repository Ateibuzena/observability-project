/*Conectar módulos*/

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { MetricsModule } from './observability/metrics/metrics.module';
import { AppLoggerModule } from './observability/logging/logger.module';

@Module({
	imports: [MetricsModule],
	controllers: [AppController],
})
export class AppModule { }
