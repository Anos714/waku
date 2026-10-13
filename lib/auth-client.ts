"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-side Better Auth client. Requests resolve to the mounted handler at
 * /api/auth via a relative base URL, so the same client works on any origin the
 * app is deployed under.
 */
export const authClient = createAuthClient();
