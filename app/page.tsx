import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'

import { HeroSlider } from '@/components/home/HeroSlider'
import { FeatureBar } from '@/components/home/FeatureBar'
import { ShopByCategory } from '@/components/home/ShopByCategory'
import { BestSellers } from '@/components/home/BestSellers'
import { OfferBanner } from '@/components/home/OfferBanner'
import { ProductSpotlight } from '@/components/home/ProductSpotlight'
import { DoctorVideo } from '@/components/home/DoctorVideo'
import { AyurvedicBenefits } from '@/components/home/AyurvedicBenefits'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { BeforeAfter } from '@/components/home/BeforeAfter'
import { Certifications } from '@/components/home/Certifications'
import { CustomerReviews } from '@/components/home/CustomerReviews'
import { Testimonials } from '@/components/home/Testimonials'
import { BlogSection } from '@/components/home/BlogSection'
import { FAQSection } from '@/components/home/FAQSection'
import { WhatsAppCTA } from '@/components/home/WhatsAppCTA'
import { TrustBadges } from '@/components/home/TrustBadges'
import { Newsletter } from '@/components/home/Newsletter'

export const metadata: Metadata = buildMetadata({})

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <FeatureBar />
      <ShopByCategory />
      <BestSellers />
      <OfferBanner />
      <DoctorVideo />
      <AyurvedicBenefits />
      <ProductSpotlight />
      <WhyChooseUs />
      <BeforeAfter />
      <Certifications />
      <CustomerReviews />
      <Testimonials />
      <BlogSection />
      {/* <InstagramGallery /> */}
      <FAQSection />
      <WhatsAppCTA />
      <TrustBadges />
      <Newsletter />
    </>
  )
}
