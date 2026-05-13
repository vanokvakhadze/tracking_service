// Global MDX component styling. Used by every page.mdx file. Defines the
// look of headings, paragraphs, code blocks, lists, etc. so docs render
// consistently without authors having to write a class on every element.

import type { MDXComponents } from 'mdx/types'
import Link from 'next/link'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

function isInternalHref(href: string): boolean {
  return href.startsWith('/') || href.startsWith('#')
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="mt-2 mb-6 text-[36px] font-bold tracking-tight text-[var(--color-text-primary)]">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mt-10 mb-3 text-[24px] font-bold text-[var(--color-text-primary)]">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 mb-2 text-[18px] font-semibold text-[var(--color-text-primary)]">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="my-4 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="my-4 ml-5 list-disc space-y-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 ml-5 list-decimal space-y-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        {children}
      </ol>
    ),
    li: ({ children }) => <li>{children}</li>,
    strong: ({ children }) => (
      <strong className="font-semibold text-[var(--color-text-primary)]">{children}</strong>
    ),
    code: ({ children }) => (
      <code className="rounded-[4px] bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--color-text-primary)]">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="my-4 overflow-x-auto rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 font-mono text-[12px] leading-relaxed text-[var(--color-text-primary)]">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-4 border-l-4 border-[var(--color-accent)] bg-[var(--color-accent-tint)] py-3 pl-4 pr-3 text-[13px] text-[var(--color-text-primary)]">
        {children}
      </blockquote>
    ),
    a: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) => {
      if (!href) return <a {...rest}>{children}</a>
      if (isInternalHref(href)) {
        return (
          <Link href={href} className="text-[var(--color-accent)] underline hover:no-underline">
            {children as ReactNode}
          </Link>
        )
      }
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-accent)] underline hover:no-underline"
        >
          {children}
        </a>
      )
    },
    hr: () => <hr className="my-8 border-t border-[var(--color-border)]" />,
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left font-semibold text-[var(--color-text-primary)]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-[var(--color-border)] px-3 py-2 text-[var(--color-text-secondary)]">
        {children}
      </td>
    ),
    ...components,
  }
}
