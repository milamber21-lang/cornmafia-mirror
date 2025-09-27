// FILE: apps/cms/src/types/payload.d.ts
// Augment Payload's PayloadRequest so access functions can read `req.viewer` without errors.

import "payload";

declare module "payload" {
  interface PayloadRequest extends Express.Request {
    viewer?: {
      discordId?: string | null;
      rank: number;
      guildId?: string | null;
      iat?: number;
      exp?: number;
    };
  }
}

