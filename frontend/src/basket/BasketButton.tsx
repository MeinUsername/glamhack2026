import { useTranslation } from 'react-i18next'
import { button } from '../ui'
import { useBasket } from './useBasket'

interface Props {
  ideaId: string
  // 'bar': full-width strip at the bottom of an idea card; 'inline': a normal button (idea page).
  variant?: 'bar' | 'inline'
}

const barBase =
  'm-0 flex h-[52px] w-full items-center justify-center border-t-2 border-ink font-mono text-sm font-medium uppercase tracking-[0.06em]'

// «In den Korb» for an idea; once it is in the basket, it is marked and cannot be chosen again.
// Used on the idea page and in the overview of F-011.
export default function BasketButton({ ideaId, variant = 'inline' }: Props) {
  const { t } = useTranslation()
  const { has, add } = useBasket()
  if (has(ideaId)) {
    return variant === 'bar' ? (
      <p className={`${barBase} bg-paper text-accent`}>{t('basket.bought')}</p>
    ) : (
      <p className="m-0 inline-flex min-h-11 items-center self-start border-2 border-accent px-5 font-mono text-sm font-medium uppercase tracking-[0.04em] text-accent">
        {t('basket.bought')}
      </p>
    )
  }
  return (
    <button
      type="button"
      className={
        variant === 'bar'
          ? `${barBase} cursor-pointer bg-accent text-on-accent transition-colors hover:bg-ink`
          : `${button} self-start`
      }
      onClick={() => add(ideaId)}
    >
      {t('basket.add')}
    </button>
  )
}
