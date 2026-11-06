import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Faq, Features, FinalCta, Hero, Pricing, Showcase, Stats, Steps } from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <SmoothScroll>
      <Hero />
      <Stats />
      <Showcase />
      <Features />
      <Steps />
      <Pricing />
      <Faq />
      <FinalCta />
    </SmoothScroll>
  );
}
