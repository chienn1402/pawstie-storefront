/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    /**
     * Meta Conversions API access token. Optional on purpose: when it is unset
     * the /api/meta-events route no-ops, so local dev and preview deploys do
     * not need it and cannot accidentally send server-side events.
     */
    PRIVATE_META_CAPI_TOKEN?: string;
  }
}
