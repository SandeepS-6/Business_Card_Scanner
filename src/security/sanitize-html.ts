/**
 * Defense-in-depth HTML scrub for preview iframes.
 * SECURITY: Backend must sanitize template HTML before persist/send. Prefer sandboxed iframe.
 * Regex scrub is bypassable — never treat as authorization.
 */
export function sanitizeHtmlForPreview(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|xlink:href|action|formaction)\s*=\s*(['"])\s*(javascript|vbscript):[^'"]*\2/gi, '$1=$2#$2')
    .replace(/(href|src|xlink:href|action|formaction)\s*=\s*(javascript|vbscript):[^\s>]*/gi, '$1="#"')
    // Block non-image data URLs (e.g. data:text/html) while allowing data:image/*
    .replace(/(href|src|xlink:href)\s*=\s*(['"])\s*data:(?!image\/(png|jpe?g|gif|webp);)[^'"]*\2/gi, '$1=$2#$2')
    .replace(/(href|src|xlink:href)\s*=\s*data:(?!image\/(png|jpe?g|gif|webp);)[^\s>]*/gi, '$1="#"')
}

/** Escape text for safe insertion into HTML attribute/text contexts. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
