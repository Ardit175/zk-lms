// Resolves a stored upload path (e.g. "/uploads/abc.pdf") to an absolute URL
// against the backend API origin.
//
// Guards against two real-world bugs:
//  1. NEXT_PUBLIC_API_URL configured with a trailing slash → "app//uploads/.."
//     which the backend's express.static serves as 404.
//  2. Relative paths rendered as-is, which resolve against the frontend origin.
//
// Absolute URLs (http/https) are returned untouched.
export function resolveFileUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}
