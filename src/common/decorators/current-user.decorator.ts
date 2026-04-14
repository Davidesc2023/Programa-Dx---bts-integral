import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface ICurrentUser {
  userId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ICurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return {
      userId: user.sub,
      email: user.email,
      role: user.role,
    };
  },
);
