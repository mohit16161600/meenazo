import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PageHero } from "@/components/layout/PageHero";
import { siteConfig } from "@/data/site";
import { ContactForm } from "./ContactForm";

const socialIcon: Record<string, string> = {
  Instagram: "instagram",
  Facebook: "facebook",
  YouTube: "youtube",
  Twitter: "twitter",
  WhatsApp: "whatsapp",
};

export const metadata: Metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Get in touch with the Meenazo team. Reach our Ayurvedic experts by phone, email or WhatsApp — we reply within 24 hours.",
  path: "/contact",
});

const supportHours = [
  { day: "Monday – Friday", hours: "9:00 AM – 8:00 PM" },
  { day: "Saturday", hours: "10:00 AM – 6:00 PM" },
  { day: "Sunday", hours: "Closed" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="We're here to help"
        title="Get in touch"
        subtitle="Questions about a product, an order, or which formula is right for you? Our wellness team and qualified Ayurvedic advisors are ready to help."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className="section-y">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* Form */}
            <div className="card-surface p-6 md:p-8">
              <h2 className="text-2xl font-bold text-ink">Send us a message</h2>
              <p className="mt-2 text-muted">
                Fill in the form below and we&apos;ll get back to you within one business day.
              </p>
              <div className="mt-7">
                <ContactForm />
              </div>
            </div>

            {/* Contact info */}
            <div className="space-y-6">
              <div className="card-surface p-6 md:p-8">
                <h3 className="text-lg font-semibold text-ink">Contact details</h3>
                <ul className="mt-5 space-y-5">
                  <li className="flex gap-4">
                    <Icon name="phone" size={22} className="shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-ink">Phone</p>
                      <a
                        href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
                        className="text-sm text-muted hover:text-brand transition-colors"
                      >
                        {siteConfig.phone}
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <Icon name="mail" size={22} className="shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-ink">Email</p>
                      <a
                        href={`mailto:${siteConfig.email}`}
                        className="text-sm text-muted hover:text-brand transition-colors"
                      >
                        {siteConfig.email}
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <Icon name="whatsapp" size={22} className="shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-ink">WhatsApp</p>
                      <a
                        href={`https://wa.me/${siteConfig.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted hover:text-brand transition-colors"
                      >
                        Chat with an Ayurvedic expert
                      </a>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <Icon name="map-pin" size={22} className="shrink-0 text-brand" />
                    <div>
                      <p className="text-sm font-medium text-ink">Address</p>
                      <p className="text-sm text-muted">{siteConfig.address}</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="card-surface p-6 md:p-8">
                <h3 className="text-lg font-semibold text-ink">Support hours</h3>
                <ul className="mt-4 space-y-2.5">
                  {supportHours.map((s) => (
                    <li key={s.day} className="flex items-center justify-between text-sm">
                      <span className="text-muted">{s.day}</span>
                      <span className="font-medium text-ink">{s.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card-surface p-6 md:p-8">
                <h3 className="text-lg font-semibold text-ink">Follow us</h3>
                <div className="mt-4 flex flex-wrap gap-3">
                  {siteConfig.social.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-brand transition-colors hover:bg-mint"
                    >
                      <Icon name={socialIcon[s.label] ?? s.icon} size={18} />
                    </a>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div
                className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-brand bg-mint text-center"
                role="img"
                aria-label="Map showing Meenazo's location in Bengaluru"
              >
                <Icon name="map-pin" size={48} className="text-brand-dark" />
                <p className="mt-3 max-w-xs px-4 text-sm font-medium text-brand-dark">
                  Meenazo Wellness, Bengaluru, Karnataka
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
