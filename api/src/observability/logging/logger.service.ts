/*Esto es la base: logs estructurados y consistentes*/
/*Regla brutal: nunca loguees cuerpos de request, headers con Authorization, passwords o tokens. Solo IDs, códigos de error y mensajes generales.*/

import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class AppLogger implements LoggerService {
	private logger = pino();

	log(message: string) { this.logger.info(message); }

	error(message: string, trace?: string) { this.logger.error({ message, trace }); }

	warn(message: string) { this.logger.warn(message); }

	debug(message: string) { this.logger.debug(message); }

}