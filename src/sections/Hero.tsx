import { HERO } from '../data/content';
import kv1280 from '../assets/kv/kv-1280.webp';
import kv1920 from '../assets/kv/kv-1920.webp';
import kv2560 from '../assets/kv/kv-2560.webp';
import kvPhone780 from '../assets/kv/kv-phone-780.webp';
import kvPhone1170 from '../assets/kv/kv-phone-1170.webp';
import './Hero.css';

/** Below this width the banner KV is too small to read, so phones get the photo + live title. */
const PHONE_QUERY = '(max-width: 699px)';

/**
 * 00 · Hero (US-02, #26). Desktop and tablet show the whole no-info KV banner, uncropped, with
 * the title baked in; phones show a portrait slice of the KV's original photo and the title as
 * live text (scripts/gen-kv-images.py). People in the artwork are allowed (#26 A-4).
 */
export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <picture className="hero__kv">
        <source media={PHONE_QUERY} srcSet={`${kvPhone780} 780w, ${kvPhone1170} 1170w`} sizes="100vw" />
        {/* The title next to it carries the words, so the image itself is decorative. */}
        <img
          src={kv1920}
          srcSet={`${kv1280} 1280w, ${kv1920} 1920w, ${kv2560} 2560w`}
          sizes="100vw"
          width={3713}
          height={1152}
          alt=""
          fetchPriority="high"
          decoding="async"
        />
      </picture>

      <div className="wrap hero__content">
        <h1 id="hero-title" className="hero__title">
          <span className="hero__more">{HERO.title}</span>
          <span className="hero__series">
            {HERO.series} <span className="hero__series-zh">{HERO.zh}</span>
          </span>
        </h1>
        <p className="hero__date">{HERO.date}</p>
        <p className="hero__lead">{HERO.lead}</p>
        <div className="hero__actions">
          <a className="btn btn--gold btn--lg" href="#appreciate">
            {HERO.cta}
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
