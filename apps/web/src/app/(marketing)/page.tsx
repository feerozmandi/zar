import { Faq } from "../_components/marketing/faq";
import { Hero } from "../_components/marketing/hero";
import { ModuleCards } from "../_components/marketing/module-cards";
import { Stats } from "../_components/marketing/stats";
import { AiEngine } from "../_components/marketing/ai-engine";

/** لندینگ پیج اصلی Xennic — ساختار دقیق نوت ۴ §۲ تا §۶ */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <AiEngine />
      <ModuleCards />
      <Stats />
      <Faq />
    </>
  );
}
