import Link from 'next/link'

export const metadata = {
  title: 'გამოყენების პირობები — TrackPro',
}

const LAST_UPDATED = '2026-05-13'

export default function TermsPage() {
  return (
    <main className="px-6 py-16">
      <article className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="text-[12px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            ბოლო განახლება: {LAST_UPDATED}
          </p>
          <h1 className="mt-2 text-[36px] font-bold tracking-tight text-[var(--color-text-primary)]">
            გამოყენების პირობები
          </h1>
          <p className="mt-3 text-[15px] text-[var(--color-text-secondary)]">
            ეს დოკუმენტი არეგულირებს TrackPro-ის გამოყენებას. სერვისზე რეგისტრაციით ვადასტურებთ, რომ
            წაიკითხე და დაეთანხმე.
          </p>
        </header>

        <Section title="1. სერვისი">
          <p>
            TrackPro წარმოადგენს B2B SaaS პროდუქტს თანამშრომელთა GPS ცვლების ავტომატური
            აღრიცხვისთვის. სერვისი მოიცავს web aplikaciaს, მობილური აპლიკაციას, და უკან მხარის
            API-ს. სერვისის მფლობელი — Sazeo (საქართველო).
          </p>
        </Section>

        <Section title="2. ანგარიში და მომხმარებლები">
          <ul className="ml-5 list-disc space-y-2">
            <li>ანგარიშის შექმნა მხოლოდ 18+ წლის პირისთვის.</li>
            <li>
              დამქირავებელი (კომპანია) პასუხისმგებელია თანამშრომლების ინფორმირებაზე GPS ტრექინგის
              შესახებ — ეს კანონისადმი მოთხოვნაა.
            </li>
            <li>
              ანგარიშის უსაფრთხოება შენი პასუხისმგებლობაა — საიდუმლო პაროლის გაზიარების შემთხვევაში
              ჩვენ პასუხს არ ვაგებთ.
            </li>
            <li>
              ერთი ანგარიში — ერთი ბიზნესისთვის. Resale ან white-label — Enterprise plan-ის
              ფარგლებში მხოლოდ.
            </li>
          </ul>
        </Section>

        <Section title="3. ფასი და გადახდა">
          <ul className="ml-5 list-disc space-y-2">
            <li>14 დღიანი უფასო ცდა — ბარათი არ მოითხოვება.</li>
            <li>
              ცდის შემდეგ subscription-ი ფიქსირდება Stripe-ით. ფასი — თვეში თითო აქტიური
              თანამშრომელი (იხ.{' '}
              <Link href="/pricing" className="text-[var(--color-accent)] hover:underline">
                ფასები
              </Link>
              ).
            </li>
            <li>
              თანამშრომელთა რაოდენობის ცვლილებაზე billing პერიოდის შემდეგ ხდება pro-rated ცვლილება.
            </li>
            <li>გადახდის გადადება ან cancel-ი — ნებისმიერ დროს. წინა გადასახდელი არ ბრუნდება.</li>
            <li>გადასახადები (VAT, EU VAT) — Stripe-ის invoice-ში ჩართულია, თუ relevant.</li>
          </ul>
        </Section>

        <Section title="4. დასაშვები გამოყენება">
          <p>აკრძალულია:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>თანამშრომლის თანხმობის გარეშე ლოკაციის ტრექინგი.</li>
            <li>სერვისის გამოყენება უკანონო მიზნით (mass surveillance, stalking).</li>
            <li>Reverse engineering, API rate limit-ის ბუნდოვანი გადაკვეთა, ან DoS attack-ი.</li>
            <li>სხვისი ანგარიშის უნებართვო წვდომა (mock GPS-ით cheating ცვლის წერისთვის).</li>
            <li>White-label resale Enterprise plan-ის გარეშე.</li>
          </ul>
          <p className="mt-3">ამ პუნქტების დარღვევა იწვევს ანგარიშის შეჩერებას უანაზღაუროდ.</p>
        </Section>

        <Section title="5. სერვისის ხელმისაწვდომობა">
          <p>
            ვცდილობთ 99.5%-იანი uptime-ი (პრო და Enterprise) — Basic plan-ისთვის best-effort.
            ცალკეული downtime შესაძლოა მოხდეს scheduled maintenance-ისთვის ან Supabase / Stripe /
            Mapbox ბრუნდი მიზეზებიდან. ცალკეული გადასახდელის რეფანდი — შემთხვევითი ფიქსირებული tier
            (Enterprise SLA).
          </p>
        </Section>

        <Section title="6. ინტელექტუალური საკუთრება">
          <p>
            TrackPro-ის source code, design, brand — Sazeo-ის საკუთრებაა. სერვისის გამოყენების
            შემთხვევაში მოგენიჭებათ ლიცენზია გამოყენებაზე, არა საკუთრებაზე. შენი მონაცემები — შენი
            საკუთრებაა.
          </p>
        </Section>

        <Section title="7. პასუხისმგებლობის შეზღუდვა">
          <p>
            სერვისი მიეწოდება „as is". არ ვაგებთ პასუხს indirect / consequential damages-ზე.
            ერთჯერადი maximum responsibility — შენი წინა 12 თვის გადახდილი თანხის ოდენობით. ეს არ
            ვრცელდება განზრახ მავნე ქმედებაზე ან რომელიც კანონითა აკრძალულია.
          </p>
        </Section>

        <Section title="8. ცვლილებები სერვისზე">
          <p>
            ფიჩერების დამატება ან ცვლილება შესაძლებელია ნებისმიერ დროს. დიდი ცვლილების შემთხვევაში
            გაცნობებთ ელფოსტითა 30 დღით ადრე. შენ შეგიძლია cancel გააკეთო, თუ ცვლილება არ მოგერგო.
          </p>
        </Section>

        <Section title="9. ანგარიშის შეჩერება">
          <p>
            შენ შეგიძლია ნებისმიერ დროს გაუჩერო subscription-ი ბილინგის გვერდიდან. ჩვენ შეგვიძლია
            გაუჩერო ანგარიში პუნქტი 4-ის დარღვევის შემთხვევაში, წინამძღოლი 30 დღიანი notice-ით, ან
            გადასახდელის გადახდის 30+ დღით დაგვიანების შემთხვევაში.
          </p>
        </Section>

        <Section title="10. სამართალი და დავა">
          <p>
            ეს ხელშეკრულება რეგულირდება საქართველოს კანონმდებლობით. დავის შემთხვევაში განიხილავს
            თბილისის საქალაქო სასამართლო.
          </p>
        </Section>

        <Section title="11. დაგვიკავშირდი">
          <p>
            ნებისმიერი კითხვა —{' '}
            <a
              href="mailto:hello@trackpro.ge"
              className="text-[var(--color-accent)] hover:underline"
            >
              hello@trackpro.ge
            </a>
            .
          </p>
        </Section>

        <footer className="border-t border-[var(--color-border)] pt-6 text-[12px] text-[var(--color-text-tertiary)]">
          იხილე ასევე{' '}
          <Link href="/privacy" className="text-[var(--color-accent)] hover:underline">
            კონფიდენციალურობის პოლიტიკა
          </Link>
          .
        </footer>
      </article>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-[20px] font-semibold text-[var(--color-text-primary)]">{title}</h2>
      <div className="space-y-3 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
        {children}
      </div>
    </section>
  )
}
