import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/types';
import { RequestWithUser } from 'src/user/interface';

export const Roles = Reflector.createDecorator<Role[]>();

const matchRoles = (roles: Role[], role: Role) => {
  return roles.includes(role);
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      throw new NotFoundException('Roles not found');
    }
    const request: RequestWithUser = context.switchToHttp().getRequest();
    const user = request.user;

    const isMatched = matchRoles(roles, user.role);
    if (!isMatched) throw new UnauthorizedException('Unauthorized');
    return true;
  }
}
