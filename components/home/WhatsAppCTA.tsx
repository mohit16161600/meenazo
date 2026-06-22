import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { whatsappCta } from "@/data/offers";
import { siteConfig } from "@/data/site";

/**
 * Brand-gradient panel inviting shoppers to consult an Ayurvedic expert
 * over WhatsApp. White CTA button opens a wa.me chat in a new tab.
 */
export function WhatsAppCTA() {
  return (
    <section className="section-y">
      <Container>
        <div className="relative overflow-hidden rounded-brand bg-gradient-to-br from-brand to-brand-dark px-6 py-12 text-white shadow-brand-lg sm:px-10 md:px-14 md:py-16">
          {/* Decorative emoji */}
          <span
            className="pointer-events-none absolute -right-6 -bottom-8 select-none text-[180px] leading-none opacity-20 md:text-[240px]"
            aria-hidden
          >
            💬
          </span>

          <div className="relative max-w-2xl">
            <span className="eyebrow text-brand-light">{whatsappCta.eyebrow}</span>
            <h2 className="mt-2 text-white">{whatsappCta.title}</h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/85">
              {whatsappCta.description}
            </p>
            <a
              href={`https://wa.me/${siteConfig.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg mt-7 bg-white text-brand-dark hover:bg-mint"
            >
              <Icon name="whatsapp" size={20} /> {whatsappCta.buttonText}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
