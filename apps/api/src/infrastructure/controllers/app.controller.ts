import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('root')
@Controller()
export class AppController {
    @Get()
    @ApiOperation({ summary: 'API Root Status' })
    getHello() {
        return {
            status: 'success',
            message: 'Organizer Hub Enterprise API is LIVE 🚀',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            endpoints: {
                health: '/api/health',
                docs: '/api/docs',
                festivals: '/api/festivals',
                puja: '/api/puja/current'
            }
        };
    }
}
