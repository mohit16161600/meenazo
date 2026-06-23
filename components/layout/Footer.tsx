import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { NewsletterForm } from "@/components/home/Newsletter";
import { siteConfig } from "@/data/site";
import { footerColumns } from "@/data/navigation";
import { Icon, IconPhone, IconMail, IconMapPin } from "@/components/ui/Icon";

/** Professional site footer (template `footer`). */
export function Footer() {
  return (
    <footer className="bg-ink text-[#cdd6d0] pt-16 pb-7 mt-0">
      <Container>
        {/* Newsletter strip */}
        <div className="bg-white/5 border border-white/10 rounded-brand p-7 md:p-9 mb-12 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-white text-2xl font-bold">Join the Meenazo family</h3>
            <p className="text-[#9fb0a7] mt-2 text-sm">
              Ayurvedic tips, new arrivals & member-only offers — straight to your inbox. Get 15% off your first order.
            </p>
          </div>
          <NewsletterForm dark />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          <div className="col-span-2">
            <Logo dark className="mb-4" />
            <p className="max-w-xs text-sm text-[#9fb0a7]">{siteConfig.description}</p>
            <div className="mt-5 space-y-2.5 text-sm text-[#9fb0a7]">
              <p className="flex items-center gap-2.5">
                <IconPhone size={16} className="text-brand-light shrink-0" /> {siteConfig.phone}
              </p>
              <p className="flex items-center gap-2.5">
                <IconMail size={16} className="text-brand-light shrink-0" /> {siteConfig.email}
              </p>
              <p className="flex items-start gap-2.5 max-w-xs">
                <IconMapPin size={16} className="text-brand-light shrink-0 mt-0.5" /> {siteConfig.address}
              </p>
              <p className="text-[13px] text-[#7e9088] pt-1">
                GST: {siteConfig.gst} · PAN: {siteConfig.pan}
              </p>
            </div>
            <div className="flex gap-3 mt-5">
              {siteConfig.social.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-brand flex items-center justify-center transition-colors text-white"
                >
                  <Icon name={s.label} size={18} />
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-white text-[15px] font-semibold mb-4">{col.heading}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[#9fb0a7] hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payment + bottom */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-[13px] text-[#7e9088]">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {siteConfig.paymentMethods.map((p) => (
              <span
                key={p.label}
                title={p.label}
                className="px-2.5 py-1 rounded-md bg-white/10 text-xs flex items-center gap-1"
              >
                {p.icon} {p.label}
              </span>
            ))}
          </div>
        </div>
        <p className="text-center text-[11px] text-[#5f7269] mt-6 max-w-3xl mx-auto leading-relaxed">
          Disclaimer: These statements have not been evaluated by the FDA/Ministry of AYUSH. Meenazo products are not
          intended to diagnose, treat, cure or prevent any disease. Consult your physician before use.
        </p>
      </Container>
    </footer>
  );
}
