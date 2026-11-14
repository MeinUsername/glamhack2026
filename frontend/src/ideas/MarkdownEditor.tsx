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
    `cursor-pointer rounded-t-lg border border-b-0 px-3 py-1 text-sm ${
      active
        ? 'border-slate-300 bg-white font-medium dark:border-slate-700 dark:bg-slate-900'
        : 'border-transparent text-slate-500 dark:text-slate-400'
    }`
  return (
    <div className="grid gap-1">
      <span className="text-sm font-medium">{label}</span>
      <div role="tablist" className="flex gap-1">
        <button type="button" role="tab" aria-selected={!preview} className={tab(!preview)} onClick={() => setPreview(false)}>
          {t('ideas.markdown.write')}
        </button>
        <button type="button" role="tab" aria-selected={preview} className={tab(preview)} onClick={() => setPreview(true)}>
          {t('ideas.markdown.preview')}
        </button>
      </div>
      {preview ? (
        <div role="tabpanel" className="min-h-48 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          {value.trim() ? <MarkdownView text={value} /> : <p className={muted}>{t('ideas.markdown.empty')}</p>}
        </div>
      ) : (
        <div role="tabpanel" className="overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
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
