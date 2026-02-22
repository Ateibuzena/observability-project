/*Esto es la base: logs estructurados y consistentes*/

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: { //quitar en produccion
				transport: {
					target: 'pino-pretty',
					options: {
						colorize: true,
						translateTime: 'SYS:standard',
						ignore: 'pid,hostname',
					},
				},
			},
		}),
	],
})
export class AppLoggerModule { }