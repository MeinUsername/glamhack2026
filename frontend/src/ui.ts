// Shared Tailwind class names, so that all pages look alike (F-016).
// Design direction E «Rund & laut»: the tokens live in index.css (@theme); here they are combined.

// Page title: big and plain. Wrap a word in `mark` to set it on a tilted coral pill.
export const h1 =
  'mt-2 mb-8 font-display text-[clamp(56px,9vw,128px)] font-semibold leading-[0.95] tracking-[-0.045em] break-words'
// Smaller page title for long, user-written titles (idea page).
export const h1Compact =
  'mt-2 mb-6 font-display text-[clamp(40px,6vw,76px)] font-semibold leading-[1] tracking-[-0.035em] break-words'
export const mark =
  'inline-block -rotate-2 rounded-full bg-coral px-[0.3em] pt-[0.02em] pb-[0.12em] text-ink [box-decoration-break:clone] [-webkit-box-decoration-break:clone]'
// Title of several words (start page): a bit smaller, with room between the lines so the
// marker of one line never covers the line above, and hyphenation instead of hard breaks.
export const h1Long =
  'mt-0 mb-8 font-display text-[clamp(40px,6.5vw,96px)] font-semibold leading-[1.2] tracking-[-0.04em] hyphens-auto [overflow-wrap:break-word]'
// Coral marker for longer titles: wraps line by line instead of forming one pill.
export const markLong =
  'rounded-[0.3em] bg-coral px-[0.16em] py-[0.02em] text-ink [box-decoration-break:clone] [-webkit-box-decoration-break:clone]'
export const h2 = 'mt-10 mb-3 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.025em]'
// Labels, metadata, table heads: mono, uppercase.
export const label = 'font-mono text-[13px] font-medium uppercase tracking-[0.05em] text-ink'
export const muted = 'text-ink-2'
export const errorText = 'font-medium text-danger'
export const noticeText = 'font-medium text-success'

// Form controls without width, e.g. for a select inside a table.
export const inputBase =
  'min-h-11 rounded-field border-2 border-ink bg-paper px-3 py-2 text-base text-ink outline-offset-0 placeholder:text-[#595959] disabled:cursor-not-allowed disabled:opacity-50 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1 file:font-sans file:text-sm file:font-semibold file:text-on-accent'
export const input = `${inputBase} w-full`

const buttonShape =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-6 py-2 font-sans text-base font-semibold no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-50'
// Primary: ultramarine, white text; black on hover.
export const button = `${buttonShape} border-accent bg-accent text-on-accent hover:border-ink hover:bg-ink hover:text-on-accent disabled:hover:border-accent disabled:hover:bg-accent`
// Dark: black, white text; ultramarine on hover (the basket button on cards).
export const buttonDark = `${buttonShape} border-ink bg-ink text-on-accent hover:border-accent hover:bg-accent hover:text-on-accent`
// On an ultramarine surface: white outline, white on hover.
export const buttonOnAccent = `${buttonShape} border-paper bg-transparent text-on-accent hover:bg-paper hover:text-ink disabled:hover:bg-transparent disabled:hover:text-on-accent`
// Secondary: white with black frame; black on hover.
export const buttonSecondary = `${buttonShape} border-ink bg-paper text-ink hover:bg-ink hover:text-on-accent disabled:hover:bg-paper disabled:hover:text-ink`
export const linkButton =
  'inline-flex min-h-11 cursor-pointer items-center bg-transparent px-1 font-sans text-base font-medium text-accent underline decoration-2 underline-offset-4 enabled:hover:text-ink disabled:cursor-not-allowed disabled:opacity-40'
// Round tool button (↑, ↓, ×).
export const iconButton =
  'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full bg-transparent px-3 font-sans text-base text-ink enabled:hover:bg-coral disabled:cursor-not-allowed disabled:opacity-30'

// Header navigation.
export const navLink =
  'inline-flex min-h-11 items-center rounded-full px-[18px] py-[10px] font-sans text-base font-medium text-ink no-underline hover:bg-accent-soft hover:text-ink'
export const navLinkActive = 'bg-ink text-on-accent hover:bg-ink hover:text-on-accent'

export const card = 'rounded-card border-2 border-ink bg-paper p-6'
export const chip =
  'inline-flex items-center rounded-full border-2 border-ink bg-paper px-3 py-1 font-mono text-xs uppercase tracking-[0.04em]'
export const tableWrap = 'overflow-x-auto rounded-card border-2 border-ink bg-paper'
export const table = 'w-full border-collapse text-[15px]'
export const cell = 'border-b border-ink/15 px-4 py-3 text-left align-middle'
export const headCell =
  'bg-ink px-4 py-3 text-left align-middle font-mono text-xs font-medium uppercase tracking-[0.06em] text-on-accent'
