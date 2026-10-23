/**
 * URL of a file from /public (icons, music). Built with Vite's base so the app works both at a site root
 * (dev server) and inside a subfolder such as https://playlistmag.studio/hotel/.
 */
export const assetUrl = (path: string): string => import.meta.env.BASE_URL + path.replace(/^\/+/, "");
