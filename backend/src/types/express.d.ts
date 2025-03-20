// No imports needed - we'll use a simpler approach

declare global {
  namespace Express {
    interface Request {
      user: {
        id: string;
        role: string;
        email?: string;
        name?: string;
      };
    }
  }
}

// This file is intentionally left empty as the Express Request interface
// is already extended in the auth.ts middleware file
