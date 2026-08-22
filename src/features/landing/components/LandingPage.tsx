import { LandingHeader } from "./LandingHeader";
import { HeroSection } from "./HeroSection";
import { FeaturesSection } from "./FeaturesSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { PricingSection } from "./PricingSection";
import { FaqSection } from "./FaqSection";
import { CtaSection } from "./CtaSection";
import { LandingFooter } from "./LandingFooter";

/**
 * Public landing (`/`).
 *
 * Bölmə ardıcıllığı "Hero → dəyər → proses → qiymət → etiraz → çağırış"
 * qaydasındadır: oxucu əvvəlcə nə olduğunu, sonra necə işlədiyini görür,
 * qərar anında isə şübhələri artıq cavablanıb.
 *
 * Daxili sistem səhifələrinin dizayn sistemi (docs/design-system.md) burada
 * ƏVƏZ EDİLMİR — token-lar (emerald/stone, `rounded-card`, `focus-ring`)
 * eynidir, yalnız marketinq səthinin şkalası daha genişdir.
 */
export function LandingPage() {
  return (
    <div className="min-h-full bg-white">
      <LandingHeader />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
