import { useTranslation } from 'react-i18next'
import { useBasket } from './useBasket'

interface Props {
  ideaId: string
  // 'bar': full-width pill at the bottom of an idea card; 'inline': a normal button (idea page).
  variant?: 'bar' | 'inline'
}

// The round knob at the right end of the pill (+ to add, ✓ when it is in the basket).
const knob = 'inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-xl leading-none'

// «In den Korb» for an idea; once it is in the basket, it is marked and cannot be chosen again.
// Used on the idea page and in the overview of F-011.
export default function BasketButton({ ideaId, variant = 'inline' }: Props) {
  const { t } = useTranslation()
  const { has, add } = useBasket()
  const width = variant === 'bar' ? 'w-full' : 'self-start'
  if (has(ideaId)) {
    return (
      <p
        className={`m-0 inline-flex min-h-[52px] items-center justify-between gap-3 rounded-full border-2 border-accent bg-paper py-1 pr-1.5 pl-6 font-bold text-accent ${width}`}
      >
        <span>{t('basket.bought')}</span>
        <span aria-hidden="true" className={`${knob} bg-accent text-base text-on-accent`}>
          ✓
        </span>
      </p>
    )
  }
  return (
    <button
      type="button"
      className={`inline-flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-full border-2 border-accent bg-accent py-1 pr-1.5 pl-6 font-sans text-base font-bold text-on-accent transition-colors hover:border-ink hover:bg-ink ${width}`}
      onClick={() => add(ideaId)}
    >
      <span>{t('basket.add')}</span>
      <span aria-hidden="true" className={`${knob} bg-coral text-ink`}>
        +
      </span>
    </button>
  )
}
