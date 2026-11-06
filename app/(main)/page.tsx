import { Faq, Features, FinalCta, Hero, Pricing, Showcase, Stats, Steps } from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Stats />
      <Showcase />
      <Features />
      <Steps />
      <Pricing />
      <Faq />
      <FinalCta />
    </>
  );
}
