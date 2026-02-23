export const ADMIN_COOKIE_NAME = "nexora_admin_session";
export const ADMIN_COOKIE_VALUE = "nexora_admin_ok_v1";

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";

export function isAdminSession(value?: string | null) {
  return value === ADMIN_COOKIE_VALUE;
}
