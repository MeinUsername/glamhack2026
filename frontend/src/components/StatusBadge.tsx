import { useTranslation } from 'react-i18next'
import type { IdeaStatus } from '../types'

// F-030: marks ideas that are not published. Only admins get such ideas from the API.
export default function StatusBadge({ status }: { status?: IdeaStatus }) {
  const { t } = useTranslation()
  if (!status || status === 'published') return null
  return (
    <span
      data-status={status}
      className="inline-flex w-fit items-center rounded-full border-2 border-ink bg-coral-soft px-3 py-0.5 font-mono text-xs font-medium uppercase"
    >
      {t(`status.${status}`)}
    </span>
  )
}
