/** Visual preview flag only. This is not authentication. */
export const PREVIEW_COOKIE = "jdm-demo-hub-preview";

export function markPreviewSignedIn() {
  document.cookie = `${PREVIEW_COOKIE}=1; Path=/; SameSite=Lax`;
}

export function clearPreviewSignIn() {
  document.cookie = `${PREVIEW_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
