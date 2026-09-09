import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';

export const CurrentStore = createParamDecorator(
  (data: { required?: boolean } | undefined, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const storeId = request.user?.storeId;

    const isRequired = data?.required !== false;

    if (isRequired && !storeId) {
      throw new ForbiddenException('Store context is required for this operation');
    }

    return storeId;
  },
);
