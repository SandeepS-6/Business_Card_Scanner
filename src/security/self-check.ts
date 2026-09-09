/**
 * Minimal security self-check (no test framework).
 * Run: npx tsx src/security/self-check.ts
 */
import { can } from './permissions'
import { sanitizeExternalUrl } from './safe-url'
import { validateImageFiles } from './file-validation'
import { sanitizeHtmlForPreview } from './sanitize-html'
import { toUserErrorMessage, ApiError } from './api-errors'

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg)
}

assert(!can('user', 'SUPER_ADMIN_ACCESS'), 'user must not have super admin')
assert(!can('org_admin', 'SUPER_ADMIN_ACCESS'), 'org admin must not have super admin')
assert(can('super_admin', 'SUPER_ADMIN_ACCESS'), 'super admin access')
assert(!can('user', 'CONTACTS_DELETE'), 'user cannot delete contacts')
assert(can('org_admin', 'CONTACTS_DELETE'), 'admin can delete contacts')

assert(sanitizeExternalUrl('javascript:alert(1)') === null, 'block javascript urls')
assert(sanitizeExternalUrl('https://example.com')?.startsWith('https://'), 'allow https')

const bad = validateImageFiles([new File(['x'], 'x.exe', { type: 'application/octet-stream' })])
assert(bad.accepted.length === 0 && bad.rejected[0]?.reason === 'unsupported_type', 'reject exe')

const scrubbed = sanitizeHtmlForPreview('<p ok>hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>')
assert(!scrubbed.includes('<script'), 'strip script')
assert(!scrubbed.toLowerCase().includes('javascript:'), 'strip javascript href')

assert(toUserErrorMessage(new ApiError('FORBIDDEN', 'x')).includes('permission'), 'safe 403 message')
assert(!toUserErrorMessage(new Error('PostgreSQL boom at db-01')).includes('PostgreSQL'), 'no leak')

assert(!can('user', 'TICKETS_MANAGE'), 'user cannot manage tickets / internal notes')
assert(can('org_admin', 'TICKETS_MANAGE'), 'admin can manage tickets')
assert(!can('user', 'BILLING_VIEW'), 'user cannot open billing')
assert(can('org_admin', 'AUTOMATIONS_MANAGE'), 'admin can manage automations')
assert(can('user', 'TICKETS_VIEW'), 'user can open tickets')
assert(can('user', 'COMMAND_CENTER_VIEW'), 'user can open command center')

assert(!sanitizeHtmlForPreview('<a href="data:text/html,x">x</a>').includes('data:text'), 'block data:text urls')
assert(sanitizeHtmlForPreview('<img src="data:image/png;base64,xx">').includes('data:image/png'), 'allow data:image')
assert(!sanitizeHtmlForPreview('<img src=vbscript:x>').toLowerCase().includes('vbscript:'), 'block vbscript')

console.log('security self-check: ok')
