"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { findMatchingBioImage } from "@/lib/presenters/match-bio-image";
import type { WorksWheelBioImage, WorksWheelItem } from "@/lib/presenters/types";

export type { WorksWheelBioImage, WorksWheelItem } from "@/lib/presenters/types";

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"section">,
  "children"
> {
  items: WorksWheelItem[];
  /** Images matched against item filenames for an optional lightbox. */
  lightboxImages?: WorksWheelBioImage[];
  /** Sits in the middle of the ring. @default undefined */
  label?: string;
  /** Small line above the center label. @default undefined */
  labelKicker?: string;
  /** Label on the card's hover affordance. Omit to drop it. @default undefined */
  action?: string;
}

const CARD_H = 0.65;
const CARD_MAX_W = 0.42;
const CARD_RATIO = 0.684;
const STEP = 40;
const DRUM = 2.22;
const LENS = 2.7;
const RING_R = 1.14;
const BOW = 1.82;
const TITLE = 0.124;
const INDEX = 0.04;
const CULL = 1.6;
const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
const SETTLE = 140;
const EASE = 0.12;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const lerp = (start: number, end: number, amount: number) =>
  start + (end - start) * amount;
const rad = (degrees: number) => (degrees * Math.PI) / 180;
const bowAt = (drumDegrees: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDegrees)));

function place(
  ringDegrees: number,
  drumDegrees: number,
  ringRadius: number,
  drumRadius: number,
  bow: number,
  blend: number,
) {
  return (
    `translateX(${blend * bowAt(drumDegrees, bow)}px)` +
    ` rotateZ(${(1 - blend) * ringDegrees}deg) translateY(${-(1 - blend) * ringRadius}px)` +
    ` rotateX(${blend * drumDegrees}deg) translateZ(${blend * drumRadius}px)`
  );
}

type Stage = { w: number; h: number };

export function WorksWheel({
  items,
  lightboxImages = [],
  label = "Works '26",
  labelKicker,
  action = "View",
  className,
  ...props
}: WorksWheelProps) {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const lightboxRef = React.useRef<HTMLDialogElement>(null);
  const closeTimer = React.useRef<number | null>(null);
  const noticeTimer = React.useRef<number | null>(null);
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const drag = React.useRef<number | null>(null);
  const settling = React.useRef<number | null>(null);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });
  const [phoneScreen, setPhoneScreen] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const [lightboxImage, setLightboxImage] = React.useState<WorksWheelBioImage | null>(null);
  const [lightboxTitle, setLightboxTitle] = React.useState<string | null>(null);
  const [isLightboxClosing, setIsLightboxClosing] = React.useState(false);
  const [imageNotice, setImageNotice] = React.useState<string | null>(null);

  const count = items.length;
  const last = Math.max(count - 1, 0);
  const compactLayout = (stage.w > 0 && stage.w <= 600) || phoneScreen;

  React.useEffect(() => {
    const read = () => {
      const shortScreenSide = Math.min(window.screen.width, window.screen.height);
      setPhoneScreen(
        shortScreenSide <= 600 && window.matchMedia("(pointer: coarse)").matches,
      );
    };

    read();
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);
    return () => {
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
    };
  }, []);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const dialog = lightboxRef.current;
    if (!lightboxImage || !dialog) return;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [lightboxImage]);

  React.useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
    },
    [],
  );

  const openBioImage = React.useCallback(
    (item: WorksWheelItem) => {
      const match = findMatchingBioImage(item, lightboxImages);
      if (!match) {
        setImageNotice(`No matching bio image was found for ${item.title}.`);
        if (noticeTimer.current !== null) window.clearTimeout(noticeTimer.current);
        noticeTimer.current = window.setTimeout(() => setImageNotice(null), 3500);
        return;
      }
      setImageNotice(null);
      setIsLightboxClosing(false);
      setLightboxImage(match);
      setLightboxTitle(item.title);
    },
    [lightboxImages],
  );

  const closeBioImage = React.useCallback(() => {
    if (!lightboxImage || isLightboxClosing) return;
    setIsLightboxClosing(true);
    closeTimer.current = window.setTimeout(() => {
      lightboxRef.current?.close();
      setLightboxImage(null);
      setLightboxTitle(null);
      setIsLightboxClosing(false);
      closeTimer.current = null;
    }, reduced ? 0 : 180);
  }, [isLightboxClosing, lightboxImage, reduced]);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const read = () => setStage({ w: element.clientWidth, h: element.clientHeight });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    // On a phone, give the portrait card more of the narrow stage while
    // leaving the right edge free for the presenter index.
    const isNarrow = (w > 0 && w <= 600) || phoneScreen;
    const cardW = Math.min(
      h * CARD_H * CARD_RATIO,
      w * (isNarrow ? 0.72 : CARD_MAX_W),
    );
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * RING_R;
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * BOW,
      depth: cardH * LENS,
      title: cardH * TITLE,
      index: cardH * INDEX,
    };
  }, [stage, count, phoneScreen]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last],
  );

  React.useEffect(() => {
    if (!stage.h || !count) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const current = turn.current;
      const blend = clamp(current, 0, 1);
      const position = Math.max(0, current - 1);
      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-blend * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const distance = i - position;
        const drumDegrees = distance * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            distance * (360 / count),
            drumDegrees,
            ringR,
            drumR,
            bow,
            blend,
          );
          card.style.opacity = blend > 0.5 && Math.abs(distance) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(distance) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, blend)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(1 - blend);
      if (titleRef.current) titleRef.current.style.opacity = String(blend);
      const near = clamp(Math.round(position), 0, last);
      setActive((previous) => (previous === near ? previous : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  React.useEffect(() => {
    const element = stageRef.current;
    if (!element || !count) return;
    const onWheel = (event: WheelEvent) => {
      const next = target.current - event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) event.preventDefault();
      to(next);
      if (settling.current !== null) window.clearTimeout(settling.current);
      settling.current = window.setTimeout(() => {
        to(Math.round(target.current));
      }, SETTLE);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      element.removeEventListener("wheel", onWheel);
      if (settling.current !== null) window.clearTimeout(settling.current);
    };
  }, [to, last, count]);

  return (
    <section
      aria-label={label}
      className={cn(
        "relative h-full min-h-[24rem] w-full overflow-hidden text-white select-none",
        className,
      )}
      {...props}
    >
      {count > 0 ? (
        <>
          <div
            ref={stageRef}
            tabIndex={0}
            role="listbox"
            aria-label={label}
            aria-activedescendant={`works-wheel-${active}`}
            className="absolute inset-0 cursor-grab touch-pan-x outline-none focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--gold)] active:cursor-grabbing"
            style={{ perspective: `${metrics.depth}px` }}
            onPointerDown={(event) => {
              const target = event.target as HTMLElement | null;
              if (target?.closest("a,button")) return;
              drag.current = event.clientY;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={(event) => {
              if (drag.current === null) return;
              to(target.current + (drag.current - event.clientY) / DRAG_UNITS);
              drag.current = event.clientY;
            }}
            onPointerUp={() => {
              drag.current = null;
              if (target.current > 1) to(Math.round(target.current));
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") to(Math.round(target.current) + 1);
              else if (event.key === "ArrowUp") to(Math.round(target.current) - 1);
              else return;
              event.preventDefault();
            }}
          >
            <div
              ref={wheelRef}
              className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
              style={{ left: "50%" }}
            >
              {items.map((item, index) => (
                <a
                  key={`${item.title}-${index}`}
                  id={`works-wheel-${index}`}
                  role="option"
                  aria-selected={index === active}
                  aria-label={item.title}
                  href={item.href ?? (lightboxImages.length > 0 ? "#presenter-bio" : undefined)}
                  onClick={(event) => {
                    if (lightboxImages.length === 0) return;
                    event.preventDefault();
                    openBioImage(item);
                  }}
                  target={item.href?.startsWith("http") ? "_blank" : undefined}
                  rel={item.href?.startsWith("http") ? "noreferrer" : undefined}
                  ref={(node) => {
                    cardRefs.current[index] = node;
                  }}
                  className="group absolute [backface-visibility:hidden]"
                  style={{
                    width: metrics.cardW,
                    height: metrics.cardH,
                    marginLeft: -metrics.cardW / 2,
                    marginTop: -metrics.cardH / 2,
                  }}
                >
                  <span className="relative block size-full overflow-hidden rounded-lg bg-black shadow-2xl ring-1 ring-white/20">
                    <img
                      src={item.image}
                      alt={item.title}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover"
                    />
                    {action ? (
                      <span className="pointer-events-none absolute right-3 bottom-3 flex translate-y-1 items-center gap-1 rounded-full bg-black/80 px-3 py-2 text-xs text-white opacity-0 backdrop-blur-sm transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
                        <span aria-hidden="true">↗</span>
                        {action}
                      </span>
                    ) : null}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div
            ref={labelRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid place-items-center px-20 text-center"
          >
            <span className="grid justify-items-center gap-2 rounded-full border border-white/25 bg-black/45 px-8 py-6 shadow-2xl shadow-black/25 backdrop-blur-md sm:px-10 sm:py-7">
              {labelKicker ? (
                <span className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--gold)] sm:text-xs">
                  {labelKicker}
                </span>
              ) : null}
              <span
                className="font-serif font-medium leading-none tracking-[-0.05em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.9)]"
                style={{ fontSize: Math.max(metrics.title, 40) }}
              >
                {label}
              </span>
            </span>
          </div>
          <div
            ref={titleRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 z-[150] -translate-x-1/2 text-center opacity-0"
            style={{
              left: "50%",
              top: `calc(50% + ${metrics.cardH / 2 + 14}px)`,
              width: `min(${metrics.cardW * 1.65}px, calc(100vw - 2rem))`,
              fontSize: Math.max(metrics.title * 0.44, 20),
            }}
          >
            <span className="mb-1 block font-sans text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-[var(--gold)] sm:text-xs">
              Featured presenter
            </span>
            <span className="block font-serif font-semibold leading-tight tracking-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.9)]">
              {items[active]?.title}
            </span>
          </div>
          {!compactLayout ? (
            <ol
            aria-label="Choose a presenter"
            className="works-wheel-index absolute top-1/2 right-[clamp(0.75rem,3vw,3rem)] z-[160] flex max-h-[72svh] -translate-y-1/2 flex-col gap-0.5 overflow-y-auto rounded-xl border border-white/15 bg-black/55 p-2 text-right shadow-xl shadow-black/30 backdrop-blur-md"
            style={{
              width: "clamp(8rem, 17vw, 14rem)",
              fontSize: Math.max(metrics.index, 12),
            }}
          >
            {items.map((item, index) => (
              <li key={`${item.title}-${index}`}>
                <button
                  type="button"
                  aria-current={index === active ? "true" : undefined}
                  onClick={() => to(index + 1)}
                  className={cn(
                    "flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2 text-left text-white/75 outline-none transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--gold)]",
                    index === active && "bg-white/10 font-medium text-white",
                  )}
                >
                  <span className="shrink-0 font-mono text-[0.65rem] tracking-wider text-[var(--gold)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1 text-right text-xs leading-tight sm:text-sm">
                    {item.title}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          ) : null}
        </>
      ) : (
        <div className="absolute inset-0 grid content-center justify-items-center gap-4 p-8 text-center">
          <p className="font-serif text-[clamp(2rem,6vw,5rem)] leading-none tracking-tight">
            {label}
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/75 sm:text-sm">
            Coming soon
          </p>
        </div>
      )}

      {imageNotice ? (
        <p
          role="status"
          className="absolute bottom-5 left-1/2 z-[180] -translate-x-1/2 rounded-lg border border-white/20 bg-black/85 px-4 py-3 text-center text-sm text-white shadow-xl backdrop-blur-md"
        >
          {imageNotice}
        </p>
      ) : null}

      {lightboxImage ? (
        <dialog
          ref={lightboxRef}
          aria-label={`Biography image for ${lightboxTitle ?? lightboxImage.fileName.replace(/\.[^.]+$/, "")}`}
          className="presenter-lightbox"
          data-closing={isLightboxClosing ? "true" : undefined}
          onCancel={(event) => {
            event.preventDefault();
            closeBioImage();
          }}
          onClick={(event) => {
            if (event.target === event.currentTarget) closeBioImage();
          }}
          onClose={() => {
            setLightboxImage(null);
            setLightboxTitle(null);
            setIsLightboxClosing(false);
          }}
        >
          <button
            type="button"
            autoFocus
            aria-label="Close biography image"
            onClick={closeBioImage}
            className="presenter-lightbox-close"
          >
            <span aria-hidden="true">×</span>
          </button>
          <figure className="presenter-lightbox-figure">
            <Image
              src={lightboxImage.src}
              alt={`Biography and conference abstract for ${lightboxTitle ?? lightboxImage.fileName.replace(/\.[^.]+$/, "")}`}
              width={lightboxImage.width}
              height={lightboxImage.height}
              sizes="92vw"
              className="presenter-lightbox-image"
            />
            <figcaption className="presenter-lightbox-caption">
              {lightboxTitle ?? lightboxImage.fileName.replace(/\.[^.]+$/, "")}
            </figcaption>
          </figure>
        </dialog>
      ) : null}
    </section>
  );
}

export default WorksWheel;
