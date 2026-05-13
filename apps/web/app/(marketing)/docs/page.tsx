import { ArrowRight, BookOpen, MapPin, Smartphone, Users, Wallet } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface Card {
  slug: string
  title: string
  description: string
  icon: ReactNode
}

const CARDS: Card[] = [
  {
    slug: 'getting-started',
    title: 'დაიწყე',
    description: 'რეგისტრაცია → პირველი ლოკაცია → თანამშრომლის invite — 5 წუთში.',
    icon: <ArrowRight className="h-5 w-5" />,
  },
  {
    slug: 'mobile-app',
    title: 'მობილური აპლიკაცია',
    description: 'iOS + Android setup, permissions, ბატარეის ოპტიმიზაცია.',
    icon: <Smartphone className="h-5 w-5" />,
  },
  {
    slug: 'locations',
    title: 'ლოკაცია + გეოფენსი',
    description: 'Two-zone pattern, hysteresis, radius-ის ბესტ პრექტისი.',
    icon: <MapPin className="h-5 w-5" />,
  },
  {
    slug: 'team',
    title: 'გუნდი + როლები',
    description: 'Admin vs Employee, invite, deactivate, super_admin.',
    icon: <Users className="h-5 w-5" />,
  },
  {
    slug: 'billing',
    title: 'ბილინგი',
    description: 'Plans, upgrade, invoice, gradახდის წყობა.',
    icon: <Wallet className="h-5 w-5" />,
  },
  {
    slug: 'faq',
    title: 'FAQ',
    description: 'ხშირი კითხვები: GPS accuracy, mock, push, offline.',
    icon: <BookOpen className="h-5 w-5" />,
  },
]

export default function DocsIndex() {
  return (
    <>
      <header className="mb-8">
        <h1 className="text-[32px] font-bold tracking-tight text-[var(--color-text-primary)]">
          დოკუმენტაცია
        </h1>
        <p className="mt-2 text-[14px] text-[var(--color-text-secondary)]">
          ყველაფერი რაც გჭირდება TrackPro-ის გასაშვებად. წავიკითხავ თანმიმდევრობით ან მოძებნე
          კონკრეტული თემა.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.slug}
            href={`/docs/${card.slug}`}
            className="group rounded-[12px] border border-[var(--color-border)] bg-white p-5 transition-colors hover:border-[var(--color-accent)]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[var(--color-accent-tint)] text-[var(--color-accent)]">
              {card.icon}
            </div>
            <h3 className="mt-3 text-[15px] font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)]">
              {card.title}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text-primary)]">პასუხს ვერ პოულობ?</strong> მოგვწერე{' '}
          <a href="mailto:hello@trackpro.ge" className="text-[var(--color-accent)] hover:underline">
            hello@trackpro.ge
          </a>{' '}
          — 1 სამუშაო დღეში გიპასუხებთ.
        </p>
      </div>
    </>
  )
}
