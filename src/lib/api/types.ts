/**
 * Shared API contracts for BOTH backends:
 * - Lovable Cloud functions (functionName)
 * - Node server routes (/api/:functionName)
 *
 * Keep this file backend-agnostic so it can be copied to your Node repo.
 */

export type ApiFunctionName =
  | "deals"
  | "site-settings"
  | "early-access"
  | "bootstrap-admin"
  | "admin-mysql-status"
  | "admin-site-settings"
  | "admin-deals"
  | "admin-early-access"
  | "admin-upload"
  | "admin-storage-settings";

// -------------------------
// Common
// -------------------------

export type DealCategory = string;

export type Deal = {
  id: string;
  title: string;
  description: string;
  image_url?: string | null;
  price?: number | null;
  original_price?: number | null;
  category: DealCategory;
  stock_left: number;
  ends_at: string; // ISO
  active: boolean;
};

export type SiteSettings = {
  brand_name: string;
  brand_tagline: string;
  header_kicker: string;
  hero_h1: string;
  hero_subtitle: string;
  whatsapp_phone_e164: string;
  whatsapp_default_message: string;
  next_drop_at: string | null;
  content: unknown;
};

// -------------------------
// Endpoint Contracts
// -------------------------

export type Deals_Get_Response = Deal[];

export type SiteSettings_Get_Response = SiteSettings;

export type EarlyAccess_Post_Body = { email: string };
export type EarlyAccess_Post_Response = { ok: true } | { ok: false; error: string };

// Admin
export type AdminMysqlStatus_Get_Response = {
  checks: Array<{ key: string; ok: boolean; message: string }>;
};

export type AdminSiteSettings_Put_Body = Partial<
  Pick<
    SiteSettings,
    | "brand_name"
    | "brand_tagline"
    | "header_kicker"
    | "hero_h1"
    | "hero_subtitle"
    | "whatsapp_phone_e164"
    | "whatsapp_default_message"
    | "next_drop_at"
  >
> & {
  content?: unknown;
};
export type AdminSiteSettings_Put_Response = { ok: true };

export type AdminSiteSettings_Patch_Body = { patch: Record<string, unknown> };
export type AdminSiteSettings_Patch_Response = { ok: true };

export type AdminDeals_Get_Response = Deal[];
export type AdminDeals_Post_Body = Omit<Deal, "id">;
export type AdminDeals_Post_Response = Deal;
export type AdminDeals_Put_Body = Deal;
export type AdminDeals_Put_Response = Deal;
export type AdminDeals_Patch_Body = { id: string; active: boolean };
export type AdminDeals_Patch_Response = { ok: true };
export type AdminDeals_Delete_Body = { id: string };
export type AdminDeals_Delete_Response = { ok: true };

export type AdminEarlyAccess_Get_Response = {
  signups: Array<{ id: string; email: string; created_at: string }>;
};

export type AdminStorageSettings_Get_Response = {
  provider: "s3" | "r2" | "cloudinary" | null;
  config: unknown | null;
};
export type AdminStorageSettings_Put_Body = {
  provider: "s3" | "r2" | "cloudinary";
  config: unknown;
};
export type AdminStorageSettings_Put_Response = { ok: true };

// Upload (admin-upload)
export type AdminUpload_Post_Response = {
  ok: true;
  url: string;
};

// Bootstrap admin
export type BootstrapAdmin_Post_Response = { ok: true } | { ok: false; error: string };

/**
 * Strongly-typed routing map.
 * Use with apiInvoke() overloads so calls stay type-safe.
 */
export type ApiRoutes = {
  deals: {
    GET: { body: undefined; response: Deals_Get_Response };
  };
  "site-settings": {
    GET: { body: undefined; response: SiteSettings_Get_Response };
  };
  "early-access": {
    POST: { body: EarlyAccess_Post_Body; response: EarlyAccess_Post_Response };
  };
  "admin-mysql-status": {
    GET: { body: undefined; response: AdminMysqlStatus_Get_Response };
  };
  "admin-site-settings": {
    PUT: { body: AdminSiteSettings_Put_Body; response: AdminSiteSettings_Put_Response };
    PATCH: { body: AdminSiteSettings_Patch_Body; response: AdminSiteSettings_Patch_Response };
  };
  "admin-deals": {
    GET: { body: undefined; response: AdminDeals_Get_Response };
    POST: { body: AdminDeals_Post_Body; response: AdminDeals_Post_Response };
    PUT: { body: AdminDeals_Put_Body; response: AdminDeals_Put_Response };
    PATCH: { body: AdminDeals_Patch_Body; response: AdminDeals_Patch_Response };
    DELETE: { body: AdminDeals_Delete_Body; response: AdminDeals_Delete_Response };
  };
  "admin-early-access": {
    GET: { body: undefined; response: AdminEarlyAccess_Get_Response };
  };
  "admin-storage-settings": {
    GET: { body: undefined; response: AdminStorageSettings_Get_Response };
    PUT: { body: AdminStorageSettings_Put_Body; response: AdminStorageSettings_Put_Response };
  };
  "admin-upload": {
    POST: { body: FormData; response: AdminUpload_Post_Response };
  };
  "bootstrap-admin": {
    POST: { body: undefined; response: BootstrapAdmin_Post_Response };
  };
};
