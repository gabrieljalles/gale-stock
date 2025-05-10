"use client";
import { useEffect, useRef, useState } from "react";

interface VideoCarouselProps {
  videos: string[];
}

const VideoCarousel = ({ videos }: VideoCarouselProps) => {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    setStarted(true);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % videos.length);
      setStarted(false);
      setTimeout(() => setStarted(true), 0);
    }, 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [current, videos.length]);

  const goTo = (index: number) => {
    setCurrent(index % videos.length);
    setStarted(false);
    setTimeout(() => setStarted(true), 0);
  };
  const prev = () => goTo((current - 1 + videos.length) % videos.length);
  const next = () => goTo((current + 1) % videos.length);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const onTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      className="mx-auto w-full lg:max-w-[720px] xl:max-w-[1124px]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <video
        key={current}
        src={videos[current]}
        className="aspect-video h-auto w-full rounded-lg"
        controls={false}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* indicadores embaixo */}
      <div className="relative bottom-3 left-1/2 flex -translate-x-1/2 transform space-x-2 px-10">
        {videos.map((_, idx) => (
          <div
            key={idx}
            onClick={() => goTo(idx)}
            className="h-1 w-8 cursor-pointer overflow-hidden rounded-sm bg-gray-500"
          >
            <div
              className="h-full bg-white"
              style={{
                width:
                  idx < current
                    ? "100%"
                    : idx === current
                      ? started
                        ? "100%"
                        : "0%"
                      : "0%",
                transition:
                  idx === current && started ? "width 5s linear" : "none",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default VideoCarousel;
