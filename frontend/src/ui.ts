// Shared Tailwind class names, so that all pages look alike (F-016).
// Design «Objektschild»: the tokens live in index.css (@theme); here they are combined into elements.

// Page title: very large, tight. Wrap a word in `mark` for the highlighter look.
export const h1 = 'mt-2 mb-8 text-[clamp(56px,7.5vw,112px)] font-bold leading-[0.95] tracking-[-0.04em] break-words'
// Smaller page title for long, user-written titles (idea page).
export const h1Compact = 'mt-2 mb-6 text-[clamp(36px,5vw,64px)] font-bold leading-[1] tracking-[-0.03em] break-words'
export const mark =
  'bg-accent px-3 text-on-accent [box-decoration-break:clone] [-webkit-box-decoration-break:clone]'
export const h2 = 'mt-10 mb-3 text-2xl font-bold tracking-[-0.02em]'
// Labels, metadata, table heads: mono, uppercase.
export const label = 'font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-ink'
export const muted = 'text-ink-2'
export const errorText = 'font-medium text-danger'
export const noticeText = 'font-medium text-success'

// Form controls without width, e.g. for a select inside a table.
export const inputBase =
  'min-h-11 rounded-none border-2 border-ink bg-paper px-3 py-2 text-base text-ink outline-offset-0 placeholder:text-[#595959] disabled:cursor-not-allowed disabled:opacity-50 file:mr-3 file:cursor-pointer file:border-0 file:bg-ink file:px-3 file:py-1 file:font-mono file:text-sm file:uppercase file:text-on-accent'
export const input = `${inputBase} w-full`

const buttonShape =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-none border-2 border-ink px-5 py-2 font-mono text-sm font-medium uppercase tracking-[0.04em] no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50'
// Primary: accent, white text; black on hover.
export const button = `${buttonShape} bg-accent text-on-accent hover:bg-ink hover:text-on-accent disabled:hover:bg-accent`
// Secondary: white with black frame; black on hover.
export const buttonSecondary = `${buttonShape} bg-paper text-ink hover:bg-ink hover:text-on-accent disabled:hover:bg-paper disabled:hover:text-ink`
export const linkButton =
  'inline-flex min-h-11 cursor-pointer items-center bg-transparent px-1 font-mono text-sm uppercase tracking-[0.04em] text-accent underline decoration-2 underline-offset-4 enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-40'
// Square tool button inside a framed row (↑, ↓, ×).
export const iconButton =
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center bg-paper px-3 font-mono text-sm uppercase text-ink enabled:hover:bg-accent enabled:hover:text-on-accent disabled:cursor-not-allowed disabled:opacity-30'

// Header navigation.
export const navLink =
  'inline-flex min-h-11 items-center px-[14px] py-[10px] font-mono text-sm uppercase tracking-[0.04em] text-ink no-underline hover:bg-accent hover:text-on-accent'
export const navLinkActive = 'bg-ink text-on-accent'

export const card = 'border-2 border-ink bg-paper p-5'
export const chip = 'inline-flex items-center border-2 border-ink px-3 py-1 font-mono text-xs uppercase tracking-[0.04em]'
export const tableWrap = 'overflow-x-auto'
export const table = 'w-full border-collapse border-2 border-ink text-[15px]'
export const cell = 'border-b-2 border-ink px-3 py-3 text-left align-middle'
export const headCell = `${cell} bg-ink font-mono text-xs font-medium uppercase tracking-[0.06em] text-on-accent`
