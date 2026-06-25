/** Default static logo in /public — used on login & POS header (not from database). */
export const STATIC_APP_LOGO = "/logo.png";

/** Turn backend upload paths or data URLs into a browser-ready image src. */
export function resolveBrandingImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/uploads/")) {
    const getApiBase = () => {
      if (process.env.NEXT_PUBLIC_API_URL) {
        return process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, "");
      }
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        return `http://${host}:7000`;
      }
      return "http://127.0.0.1:7000";
    };
    return `${getApiBase()}${url}`;
  }
  return url;
}

/** Menu item images from /uploads/menu/ or external URLs. */
export const resolveMenuImageUrl = resolveBrandingImageUrl;
