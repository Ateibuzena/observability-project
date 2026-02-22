/*Endpoint /metrics*/

import { Controller, Get, Res } from '@nestjs/common';
import { MetricsService } from './observability/metrics/metrics.service';

@Controller()
export class AppController {
	constructor(private readonly metrics: MetricsService) { }

	@Get('metrics')
	async getMetrics(@Res() res) {
		res.set('Content-Type', 'text/plain');
		res.send(await this.metrics.getMetrics());
	}

	@Get('test')
	test() {
		return { message: 'ok' };
	}
}
