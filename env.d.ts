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
    /**
     * Optional `TEST#####` code from Events Manager -> Test events. When set,
     * server events are tagged as test traffic: they appear live in that tab
     * and are EXCLUDED from reporting and ad optimization. Use it locally to
     * debug; never set it in the Oxygen production environment, or real
     * conversions stop counting.
     */
    PRIVATE_META_CAPI_TEST_CODE?: string;
    /**
     * TikTok Events API access token. Optional on the same terms as the Meta
     * one: unset makes /api/tiktok-events a no-op, so local dev and preview
     * deploys cannot accidentally send server-side events.
     */
    PRIVATE_TIKTOK_EAPI_TOKEN?: string;
    /**
     * Optional test event code from Events Manager -> Test Events. When set,
     * server events are tagged as test traffic: they appear live in that tab
     * and are EXCLUDED from reporting and ad optimization. Use it locally to
     * debug; never set it in the Oxygen production environment, or real
     * conversions stop counting.
     */
    PRIVATE_TIKTOK_EAPI_TEST_CODE?: string;
  }
}
