import Link from 'next/link';
import { PricingCards } from '@/components/marketing/PricingCards';

export default function PricingSection() {
  return (
    <section className="py-24" id="pricing">
      <div className="container">
        <div className="text-center flex flex-col items-center gap-4 mb-16">
          <div className="badge badge-primary">Simple pricing</div>
          <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold tracking-tight leading-[1.15] max-w-[700px] text-text">
            Plans that grow <span className="gradient-text">with your business</span>
          </h2>
          <p className="text-base text-text-2 max-w-[560px] leading-relaxed">Choose a package that fits your needs.</p>
        </div>
        <PricingCards showDescriptions={true} />
        <p className="text-center text-text-3 text-sm mt-8">
          <Link href="/pricing" className="text-primary hover:text-primary-dark transition-colors font-semibold">Compare full features →</Link>
        </p>
      </div>
    </section>
  );
}
