import Link from 'next/link'

export const metadata = {
  title: 'კონფიდენციალურობის პოლიტიკა — TrackPro',
}

const LAST_UPDATED = '2026-05-13'

export default function PrivacyPage() {
  return (
    <main className="px-6 py-16">
      <article className="mx-auto max-w-3xl space-y-8">
        <header>
          <p className="text-[12px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            ბოლო განახლება: {LAST_UPDATED}
          </p>
          <h1 className="mt-2 text-[36px] font-bold tracking-tight text-[var(--color-text-primary)]">
            კონფიდენციალურობის პოლიტიკა
          </h1>
          <p className="mt-3 text-[15px] text-[var(--color-text-secondary)]">
            TrackPro აპლიკაცია (შემდგომში — „სერვისი") მართავს თქვენი თანამშრომლების GPS ლოკაციას
            შრომის საათების ავტომატური აღრიცხვის მიზნით. ეს დოკუმენტი ხსნის რა მონაცემები იწერება,
            რისთვის, და როგორი უფლებები გაქვთ.
          </p>
        </header>

        <Section title="1. ვინ ვართ ჩვენ">
          <p>
            TrackPro წარმოადგენს Sazeo-ს პროდუქტს. იურიდიული მფლობელი — Sazeo (საქართველო).
            კონფიდენციალურობის ნებისმიერი კითხვა გადააგზავნე{' '}
            <a
              href="mailto:privacy@trackpro.ge"
              className="text-[var(--color-accent)] hover:underline"
            >
              privacy@trackpro.ge
            </a>
            -ზე.
          </p>
        </Section>

        <Section title="2. რა მონაცემები გროვდება">
          <p>
            სერვისი მუშაობს ორ მხარეს — დამქირავებლის ანგარიში (ადმინი) და თანამშრომელი (მობილური
            აპლიკაცია):
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-[var(--color-text-primary)]">პროფილი:</strong> სახელი, გვარი,
              ელფოსტა, ტელეფონი (თუ შეიყვანე).
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">GPS ლოკაცია:</strong> მობილური
              აპლიკაცია იწერს კოორდინატებს მაშინ, როცა აქტიური ცვლა მიდის. ფონზე ტრექინგი მხოლოდ
              ცვლის საათებშია ჩართული.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">მოწყობილობის ინფო:</strong>{' '}
              ბატარეის სიგრძე, აქტივობის ტიპი (footnote: foot/vehicle/still), Mock GPS დეტექცია,
              push token.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">ფოტო:</strong> თუ თანამშრომელი
              ნებაყოფლობით მონიშნავს ახალ ლოკაციას, ფოტო ინახება დაცულ საცავში.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">გადახდის მონაცემები:</strong>{' '}
              ბარათის ნომერი არ ინახება ჩვენთან — გადახდას ამუშავებს Stripe (PCI-DSS Level 1).
            </li>
          </ul>
        </Section>

        <Section title="3. რისთვის გროვდება">
          <ul className="ml-5 list-disc space-y-2">
            <li>ცვლის ავტომატური დაწყება/დასრულება გეოფენსის მონაცემებით.</li>
            <li>ფიქსირებული შრომის საათების რეპორტი დამქირავებლისთვის.</li>
            <li>სამუშაო ზონიდან გასვლის ალერტი.</li>
            <li>Mock GPS attempt-ის გამოვლენა.</li>
            <li>გადახდის სრულფასოვანი მართვა (subscription, invoice).</li>
          </ul>
        </Section>

        <Section title="4. სად ინახება">
          <p>
            ყველა მონაცემი ინახება Supabase პლატფორმაზე (EU რეგიონი — Frankfurt). ფოტოები — დაცულ
            Object Storage bucket-ში, წვდომა მხოლოდ ადმინს და თვითონ თანამშრომელს. push token-ები
            გადაიცემა Expo-ს push სერვისზე notification-ის ჩასაბარებლად.
          </p>
        </Section>

        <Section title="5. ვის ეცნობება">
          <p>თქვენი მონაცემები არც ერთ მესამე მხარეს არ ვყიდით. გადაიცემა მხოლოდ:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Stripe — გადახდის დასამუშავებლად</li>
            <li>Supabase — Database + Auth + Storage (data processor)</li>
            <li>Expo Push Service — push notifications</li>
            <li>Mapbox — რუკის რენდერი (anonymous; მისამართის ძებნა)</li>
            <li>Sentry (თუ ჩართულია) — ანონიმური error reporting</li>
          </ul>
        </Section>

        <Section title="6. რამდენ ხანს">
          <p>
            აქტიური ანგარიშის განმავლობაში — სანამ კომპანია იყენებს სერვისს. ანგარიშის წაშლის
            შემთხვევაში მონაცემები იწერება სრულად 30 დღეში; financial records ფიქსირდება 5 წელი
            (კანონის მოთხოვნა).
          </p>
        </Section>

        <Section title="7. შენი უფლებები">
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-[var(--color-text-primary)]">წვდომა:</strong> ნებისმიერ დროს
              მოითხოვო შენი მონაცემების ექსპორტი JSON-ში.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">გასწორება:</strong> მცდარი
              მონაცემები შეიცვალე პროფილში ან მოგვწერე.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">წაშლა:</strong> ანგარიშის
              წაშლისთვის მოგვწერე — 30 დღეში ყველაფერი წაიშლება.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">გადატანა:</strong> მონაცემები
              შეგიძლია სხვა სერვისზე გადაიტანო ნებისმიერ დროს.
            </li>
          </ul>
        </Section>

        <Section title="8. ბავშვები">
          <p>
            სერვისი არ არის გათვალისწინებული 18 წლამდე პირებისთვის. თუ ვინმემ ბავშვის მონაცემები
            აღმოაჩინა — დაუყოვნებლივ მოგვწერე.
          </p>
        </Section>

        <Section title="9. ცვლილებები">
          <p>
            პოლიტიკის მნიშვნელოვანი ცვლილების შემთხვევაში გაცნობებთ ელფოსტითა და აპლიკაციაში
            banner-ით 30 დღით ადრე.
          </p>
        </Section>

        <Section title="10. დაგვიკავშირდი">
          <p>
            ნებისმიერი კითხვა —{' '}
            <a
              href="mailto:privacy@trackpro.ge"
              className="text-[var(--color-accent)] hover:underline"
            >
              privacy@trackpro.ge
            </a>
            . უპასუხებთ 5 სამუშაო დღეში.
          </p>
        </Section>

        <footer className="border-t border-[var(--color-border)] pt-6 text-[12px] text-[var(--color-text-tertiary)]">
          იხილე ასევე{' '}
          <Link href="/terms" className="text-[var(--color-accent)] hover:underline">
            გამოყენების პირობები
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
