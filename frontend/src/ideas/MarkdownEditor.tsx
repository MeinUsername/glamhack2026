import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import MarkdownView from '../components/MarkdownView'
import { muted } from '../ui'

const extensions = [markdown(), EditorView.lineWrapping]

function prefersDark(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

// F-023: Markdown editor (CodeMirror) with a preview toggle. Toggling changes nothing in the text.
export default function MarkdownEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const [preview, setPreview] = useState(false)
  const tab = (active: boolean) =>
    `inline-flex min-h-11 cursor-pointer items-center rounded-full border-2 px-5 font-sans text-base ${
      active
        ? 'border-ink bg-ink font-semibold text-on-accent'
        : 'border-ink bg-paper text-ink hover:bg-coral-soft'
    }`
  return (
    <div className="grid gap-2">
      <span className="font-mono text-[13px] font-medium tracking-[0.05em] text-ink uppercase">{label}</span>
      <div role="tablist" className="flex flex-wrap gap-2">
        <button type="button" role="tab" aria-selected={!preview} className={tab(!preview)} onClick={() => setPreview(false)}>
          {t('ideas.markdown.write')}
        </button>
        <button type="button" role="tab" aria-selected={preview} className={tab(preview)} onClick={() => setPreview(true)}>
          {t('ideas.markdown.preview')}
        </button>
      </div>
      {preview ? (
        <div role="tabpanel" className="min-h-48 rounded-field border-2 border-ink bg-paper p-3">
          {value.trim() ? <MarkdownView text={value} /> : <p className={muted}>{t('ideas.markdown.empty')}</p>}
        </div>
      ) : (
        <div role="tabpanel" className="overflow-hidden rounded-field border-2 border-ink bg-paper">
          <CodeMirror
            value={value}
            onChange={onChange}
            extensions={extensions}
            theme={prefersDark() ? 'dark' : 'light'}
            minHeight="12rem"
            basicSetup={{ lineNumbers: false, foldGutter: false }}
            aria-label={label}
          />
        </div>
      )}
    </div>
  )
}
