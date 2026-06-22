import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { trustBadges } from "@/data/trust";

/**
 * Understated full-width strip of trust signals (secure payments, free
 * shipping, easy returns, authenticity, support). Sits between sections.
 */
export function TrustBadges() {
  return (
    <section className="bg-soft py-8 border-y border-line">
      <Container>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-line">
          {trustBadges.map((badge) => (
            <li
              key={badge.label}
              className="flex items-center gap-3 lg:justify-center lg:px-4"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mint text-brand shrink-0" aria-hidden>
                <Icon name={badge.icon} size={22} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink leading-tight">
                  {badge.label}
                </span>
                {badge.sublabel && (
                  <span className="block text-xs text-muted leading-snug">
                    {badge.sublabel}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
