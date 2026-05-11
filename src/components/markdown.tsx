import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

/**
 * Markdown renderer for editorial guides. Tailwind-styled, internal-link
 * aware: relative URLs become Next.js <Link> for prefetched navigation
 * and to help internal-link signals.
 */
export function Markdown({ source }: { source: string }) {
  return (
    <article className="markdown-body max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tightish mt-14 mb-6 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display text-2xl md:text-3xl font-semibold tracking-tightish mt-14 mb-4 pb-2 border-b border-ink-line">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-display text-xl font-semibold tracking-tightish mt-10 mb-3">{children}</h3>
          ),
          p: ({ children }) => <p className="text-[15px] leading-[1.85] text-ink-soft my-4">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-6 my-4 space-y-1.5 text-[15px] leading-[1.85] text-ink-soft marker:text-accent">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 my-4 space-y-1.5 text-[15px] leading-[1.85] text-ink-soft marker:text-accent">{children}</ol>,
          li: ({ children }) => <li className="leading-[1.85]">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>;
            const isInternal = href.startsWith("/") || href.startsWith("#");
            const isExternal = /^https?:\/\//.test(href);
            if (isInternal) {
              return (
                <Link href={href} className="text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent">
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-accent underline underline-offset-4 decoration-accent/40 hover:decoration-accent"
              >
                {children}
              </a>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l-2 border-accent bg-accent/5 px-5 py-4 text-[15px] leading-[1.85] text-ink rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = (className || "").startsWith("language-") || String(children).includes("\n");
            if (isBlock) return null;
            return <code className="font-mono text-[13px] bg-bg-elev border border-ink-line rounded px-1.5 py-0.5 text-ink">{children}</code>;
          },
          pre: ({ children }) => (
            <pre className="my-6 rounded-lg border border-ink-line bg-bg-elev p-4 overflow-x-auto font-mono text-[13px] leading-6 text-ink">
              {children}
            </pre>
          ),
          hr: () => <hr className="my-12 border-0 h-px bg-gradient-to-r from-transparent via-ink-line to-transparent" />,
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-lg border border-ink-line">
              <table className="w-full text-[13px] border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-bg-elev">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-ink border-b border-ink-line whitespace-nowrap">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-ink-soft border-t border-ink-line align-top">{children}</td>,
          tr: ({ children }) => <tr className="hover:bg-bg-elev/40">{children}</tr>,
        }}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
