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
    <a className="text-accent underline decoration-2 underline-offset-4 hover:text-ink" target="_blank" rel="noopener noreferrer" {...p} />
  ),
  blockquote: (p) => (
    <blockquote className="my-2 border-l-4 border-coral pl-3 text-ink-2" {...strip(p)} />
  ),
  pre: (p) => (
    <pre className="my-2 overflow-x-auto rounded-field border-2 border-ink bg-ground p-3 font-mono text-sm" {...strip(p)} />
  ),
  code: (p) => <code className="rounded-[6px] bg-coral-soft px-1 font-mono text-sm" {...strip(p)} />,
  table: (p) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...strip(p)} />
    </div>
  ),
  th: (p) => <th className="border border-ink/30 bg-ground px-2 py-1 text-left font-mono text-xs uppercase" {...strip(p)} />,
  td: (p) => <td className="border border-ink/30 px-2 py-1" {...strip(p)} />,
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
