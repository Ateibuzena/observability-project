/*Esto es la base: logs estructurados y consistentes*/

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: isProduction
				? {
					level: 'info',
				}
				: {
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