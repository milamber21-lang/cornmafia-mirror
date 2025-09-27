// FILE: apps/cms/src/types/express.d.ts
// Augment Express.Request with `viewer` (so anything typed as Express.Request sees it)

import "express-serve-static-core";

declare global {
  namespace Express {
    interface Request {
      viewer?: {
        discordId?: string | null;
        rank: number;
        guildId?: string | null;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};
