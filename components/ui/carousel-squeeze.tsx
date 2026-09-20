"use client";

import { type CSSProperties, type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type SqueezeSlide = {
  id?: string | number;
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  background?: string;
  overlay?: ReactNode;
};

type SqueezeCarouselProps = {
  slides: SqueezeSlide[];
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  height?: number | string;
  accent?: string;
  label?: string;
  className?: string;
};

const wrap = (value: number, length: number) => ((value % length) + length) % length;

export function SqueezeCarousel({
  slides,
  defaultIndex = 0,
  onIndexChange,
  height = "clamp(250px, 34vw, 390px)",
  accent = "#cb9c67",
  label = "Notable thinkers",
  className,
}: SqueezeCarouselProps) {
  const [active, setActive] = useState(wrap(defaultIndex, Math.max(slides.length, 1)));
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => onIndexChange?.(active), [active, onIndexChange]);

  const move = (amount: number) => setActive((current) => wrap(current + amount, slides.length));
  const select = (index: number) => setActive(wrap(index, slides.length));

  const windowStart = active < 4
    ? 0
    : active === slides.length - 1
      ? Math.max(0, slides.length - 3)
      : 2 * Math.floor((active - 4) / 2) + 3;
  const windowSize = active < 4 ? 4 : 3;
  const visibleSlides = slides.slice(windowStart, windowStart + windowSize);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = window.setInterval(() => move(1), 7000);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!slides.length) return null;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
    if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
  };

  return (
    <div
      className={cn("squeeze-carousel", className)}
      style={{ "--sq-accent": accent, "--sq-height": typeof height === "number" ? `${height}px` : height } as CSSProperties}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={onKeyDown}
      onPointerDown={(event) => { startX.current = event.clientX; }}
      onPointerUp={(event) => {
        if (startX.current === null) return;
        const distance = event.clientX - startX.current;
        if (Math.abs(distance) > 42) move(distance < 0 ? 1 : -1);
        startX.current = null;
      }}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
    >
      <div className="squeeze-controls">
        <span className="squeeze-count"><b>{String(active + 1).padStart(2, "0")}</b> / {String(slides.length).padStart(2, "0")}</span>
        <div className="squeeze-arrows">
          <button type="button" aria-label="Previous thinker" onClick={() => move(-1)}>←</button>
          <button type="button" aria-label="Next thinker" onClick={() => move(1)}>→</button>
        </div>
      </div>
      <div className="squeeze-track" style={{ height: "var(--sq-height)" }}>
        {visibleSlides.map((slide, offset) => {
          const index = windowStart + offset;
          const isActive = index === active;
          const distance = Math.abs(index - active);
          const isNear = distance === 1;
          return (
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-label={`Show ${slide.title}`}
              tabIndex={isActive ? 0 : -1}
              key={slide.id ?? index}
              onClick={() => select(index)}
              className={cn("squeeze-panel", isActive && "is-active", isNear && "is-near")}
              style={{ "--sq-order": distance } as CSSProperties}
            >
              {slide.image ? <img src={slide.image} alt={slide.imageAlt ?? ""} draggable={false} style={{ objectPosition: "50% 25%" }} /> : <span className="squeeze-placeholder" style={{ background: slide.background }} aria-hidden="true" />}
              <span className="squeeze-shade" aria-hidden="true" />
              {slide.overlay && <span className="squeeze-overlay">{slide.overlay}</span>}
            </button>
          );
        })}
      </div>
      <div className="squeeze-copy" aria-live="polite">
        <div>
          <span className="squeeze-eyebrow">Featured thinker</span>
          <h3>{slides[active].title}</h3>
          {slides[active].description && <p>{slides[active].description}</p>}
        </div>
        <div className="squeeze-dots" role="tablist" aria-label="Choose a thinker">
          {slides.map((slide, index) => <button key={slide.id ?? index} type="button" aria-label={`Go to ${slide.title}`} aria-selected={index === active} onClick={() => select(index)} />)}
        </div>
      </div>
    </div>
  );
}

export default SqueezeCarousel;
