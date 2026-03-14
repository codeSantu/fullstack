import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, defer } from 'rxjs';
import { tenantContext } from '../context/tenant.context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const organizationId = req.headers['x-organization-id'] as string;

        if (organizationId) {
            return defer(() => 
                tenantContext.run({ organizationId }, () => next.handle())
            );
        }

        return next.handle();
    }
}
