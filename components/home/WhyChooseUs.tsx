import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Icon } from "@/components/ui/Icon";
import { whyChooseUs } from "@/data/benefits";

/**
 * Home "Why choose us" section — a soft band with a centered heading and a
 * responsive grid of trust cards (3 columns desktop, 2 tablet, 1 mobile).
 */
export function WhyChooseUs() {
  return (
    <section className="section-y bg-soft">
      <Container>
        <SectionHeader
          center
          eyebrow="Why Meenazo"
          title="Wellness you can trust"
          subtitle="Every formula is held to a higher standard — from the herbs we source to the labs that test them."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {whyChooseUs.map((item) => (
            <div
              key={item.title}
              className="card-surface card-hover p-7 sm:p-8 text-center sm:text-left"
            >
              <span
                className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-mint text-brand mx-auto sm:mx-0"
                aria-hidden
              >
                <Icon name={item.icon} size={28} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{item.title}</h3>
              <p className="mt-2 text-muted leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
