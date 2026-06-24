/** Full customer menu URL encoded inside table QR codes. */
export function getPublicMenuUrl(qrCode: string): string {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:7000";

  return `${base}/menu/${encodeURIComponent(qrCode)}`;
}

/** QR image that opens the public menu when scanned. */
export function getTableQrImageUrl(qrCode: string, size = 280): string {
  const menuUrl = getPublicMenuUrl(qrCode);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(menuUrl)}`;
}
