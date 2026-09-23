import { JourneyRail } from '../../components/JourneyRail';
import { SiteFooter } from '../../components/SiteFooter';
import { SiteHeader } from '../../components/SiteHeader';
import { Anticipate } from '../../sections/Anticipate';
import { Appreciate } from '../../sections/Appreciate';
import { Hero } from '../../sections/Hero';
import { Respond } from '../../sections/Respond';
import { Transition } from '../../sections/Transition';

export function HomePage() {
  return (
    <>
      <a className="skip-link" href="#appreciate">
        跳到主要內容
      </a>
      <SiteHeader progress />
      <JourneyRail />
      <main>
        <Hero />
        <Appreciate />
        <Transition />
        <Anticipate />
        <Respond />
      </main>
      <SiteFooter />
    </>
  );
}
