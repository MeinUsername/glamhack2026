import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

// F-023: renders Markdown (GFM). Raw HTML is not rendered (no rehype-raw), unsafe URLs such as
// javascript: are dropped by react-markdown's default URL transform, and links open in a new tab.
const components: Components = {
  h1: (p) => <h3 className="mt-5 mb-2 text-xl font-semibold" {...strip(p)} />,
  h2: (p) => <h3 className="mt-5 mb-2 text-lg font-semibold" {...strip(p)} />,
  h3: (p) => <h4 className="mt-4 mb-1 font-semibold" {...strip(p)} />,
  h4: (p) => <h5 className="mt-3 mb-1 font-semibold" {...strip(p)} />,
  h5: (p) => <h6 className="mt-3 mb-1 font-medium" {...strip(p)} />,
  h6: (p) => <h6 className="mt-3 mb-1 font-medium" {...strip(p)} />,
  p: (p) => <p className="my-2" {...strip(p)} />,
  ul: (p) => <ul className="my-2 list-disc pl-6" {...strip(p)} />,
  ol: (p) => <ol className="my-2 list-decimal pl-6" {...strip(p)} />,
  a: ({ node: _node, ...p }) => (
    <a className="text-indigo-600 underline dark:text-indigo-400" target="_blank" rel="noopener noreferrer" {...p} />
  ),
  blockquote: (p) => (
    <blockquote className="my-2 border-l-4 border-slate-300 pl-3 text-slate-600 dark:border-slate-700 dark:text-slate-400" {...strip(p)} />
  ),
  pre: (p) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800" {...strip(p)} />
  ),
  code: (p) => <code className="rounded bg-slate-100 px-1 font-mono text-sm dark:bg-slate-800" {...strip(p)} />,
  table: (p) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...strip(p)} />
    </div>
  ),
  th: (p) => <th className="border border-slate-300 px-2 py-1 text-left dark:border-slate-700" {...strip(p)} />,
  td: (p) => <td className="border border-slate-300 px-2 py-1 dark:border-slate-700" {...strip(p)} />,
}

// The `node` prop of react-markdown must not reach the DOM.
function strip<T extends { node?: unknown }>({ node: _node, ...rest }: T) {
  return rest
}

export default function MarkdownView({ text }: { text: string }) {
  return (
    <div className="break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
