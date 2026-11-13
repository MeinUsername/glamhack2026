import { useTranslation } from 'react-i18next'
import { button, muted } from '../ui'
import { useBasket } from './useBasket'

interface Props {
  ideaId: string
}

// «In den Korb» for an idea; once it is in the basket, it is marked as bought and cannot be chosen again.
// Used on the idea page now and in the overview of F-011.
export default function BasketButton({ ideaId }: Props) {
  const { t } = useTranslation()
  const { has, add } = useBasket()
  if (has(ideaId)) {
    return <p className={muted}>{t('basket.bought')}</p>
  }
  return (
    <button type="button" className={button} onClick={() => add(ideaId)}>
      {t('basket.add')}
    </button>
  )
}
