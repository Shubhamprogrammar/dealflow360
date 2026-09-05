import type { Role } from './common.types.js';
declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: { id: string; role: Role };
    }
  }
}
export {};
