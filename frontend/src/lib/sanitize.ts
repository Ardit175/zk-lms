import DOMPurify from 'isomorphic-dompurify';

// Allow-list tuned to what the TipTap editor can produce.
const SAFE_HTML_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'strong', 'em', 'u', 's',
    'h1', 'h2', 'h3', 'h4',
    'ul', 'ol', 'li', 'blockquote',
    'code', 'pre', 'a', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
};

export function sanitizeHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, SAFE_HTML_CONFIG);
}
