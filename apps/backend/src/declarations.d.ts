// Ambient declarations to ensure build succeeds even if @types are pruned in production environments
declare module 'passport-jwt' {
  export const ExtractJwt: any;
  export class Strategy {
    constructor(options: any, verify: any);
  }
}

declare module 'express' {
  export interface Request {
    [key: string]: any;
  }
  export interface Response {
    [key: string]: any;
  }
  export interface NextFunction {
    (err?: any): void;
  }
}
