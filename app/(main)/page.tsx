import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Faq, Features, FinalCta, Hero, Pricing, Showcase, Stats, Steps } from "@/components/landing/sections";
import { getAppearanceSafe } from "@/lib/server/appearance";

export default async function LandingPage() {
  const { sections } = await getAppearanceSafe();
  return (
    <SmoothScroll>
      <Hero />
      {sections.stats && <Stats />}
      {sections.showcase && <Showcase />}
      {sections.features && <Features />}
      {sections.steps && <Steps />}
      {sections.pricing && <Pricing />}
      {sections.faq && <Faq />}
      {sections.finalCta && <FinalCta />}
    </SmoothScroll>
  );
}
