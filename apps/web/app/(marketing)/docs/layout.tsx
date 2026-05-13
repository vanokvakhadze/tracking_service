import { BookOpen } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'დოკუმენტაცია — TrackPro',
}

interface DocLink {
  slug: string
  title: string
  hint: string
}

const SECTIONS: { heading: string; links: DocLink[] }[] = [
  {
    heading: 'საწყისი',
    links: [
      { slug: 'getting-started', title: 'დაიწყე', hint: '1 წუთში' },
      { slug: 'mobile-app', title: 'მობილური აპლიკაცია', hint: 'permissions' },
    ],
  },
  {
    heading: 'მართვა',
    links: [
      { slug: 'locations', title: 'ლოკაცია + გეოფენსი', hint: 'two-zone' },
      { slug: 'team', title: 'გუნდი + როლები', hint: 'invite, manage' },
    ],
  },
  {
    heading: 'სხვა',
    links: [
      { slug: 'billing', title: 'ბილინგი', hint: 'plans + invoice' },
      { slug: 'faq', title: 'FAQ', hint: 'ხშირი კითხვები' },
    ],
  },
]

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-4 flex items-center gap-2 text-[var(--color-text-primary)]">
            <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
            <span className="text-[13px] font-semibold">დოკუმენტაცია</span>
          </div>
          <nav className="space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.heading}>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  {section.heading}
                </p>
                <ul className="space-y-1">
                  {section.links.map((doc) => (
                    <li key={doc.slug}>
                      <Link
                        href={`/docs/${doc.slug}`}
                        className="flex flex-col rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                      >
                        <span className="font-medium">{doc.title}</span>
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">
                          {doc.hint}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 max-w-3xl">{children}</article>
      </div>
    </main>
  )
}
