import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'

import { Reveal } from '@/components/ui/Reveal'
import { HeroSlider } from '@/components/home/HeroSlider'
import { FeatureBar } from '@/components/home/FeatureBar'
import { ShopByCategory } from '@/components/home/ShopByCategory'
import { BestSellers } from '@/components/home/BestSellers'
import { OfferBanner } from '@/components/home/OfferBanner'
import { DoctorVideo } from '@/components/home/DoctorVideo'
import { AyurvedicBenefits } from '@/components/home/AyurvedicBenefits'
import { WhyChooseUs } from '@/components/home/WhyChooseUs'
import { BeforeAfter } from '@/components/home/BeforeAfter'
import { CustomerReviews } from '@/components/home/CustomerReviews'
import { BlogSection } from '@/components/home/BlogSection'
import { FAQSection } from '@/components/home/FAQSection'
import { WhatsAppCTA } from '@/components/home/WhatsAppCTA'
import { TrustBadges } from '@/components/home/TrustBadges'
import { Newsletter } from '@/components/home/Newsletter'

export const metadata: Metadata = buildMetadata({})

export default function HomePage() {
  return (
    <>
      {/* Above the fold — render instantly, no reveal */}
      <HeroSlider />
      <FeatureBar />

      {/* Below the fold — gentle reveal-on-scroll */}
      <Reveal><ShopByCategory /></Reveal>
      <Reveal><BestSellers /></Reveal>
      <Reveal><OfferBanner /></Reveal>
      <Reveal><DoctorVideo /></Reveal>
      <Reveal><AyurvedicBenefits /></Reveal>
      <Reveal><WhyChooseUs /></Reveal>
      <Reveal><BeforeAfter /></Reveal>
      <Reveal><CustomerReviews /></Reveal>
      <Reveal><BlogSection /></Reveal>
      <Reveal><FAQSection /></Reveal>
      <Reveal><WhatsAppCTA /></Reveal>
      <Reveal><TrustBadges /></Reveal>
      <Reveal><Newsletter /></Reveal>
    </>
  )
}
