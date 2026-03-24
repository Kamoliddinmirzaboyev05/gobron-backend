import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class OwnerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { role: string } }>();
    const user = request.user;

    if (!user || user.role !== 'owner') {
      throw new ForbiddenException('Access denied. Owner role required.');
    }

    return true;
  }
}
