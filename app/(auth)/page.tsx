import HeroSection from "./sections/HeroSection";
import FeaturesSection from "./sections/FeaturesSection";
import SpecialFeaturesSection from "./sections/SpecialFeaturesSection";
import PricingSection from "./sections/PricingSection";

export default function Home() {
  return (
    <div className="flex flex-col w-screen min-h-screen bg-[#0D0D0D] overflow-x-hidden">
      <HeroSection />
      <FeaturesSection />
      <SpecialFeaturesSection />
      <PricingSection />
    </div>
  );
}