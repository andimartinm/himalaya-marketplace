'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageSliderProps {
  images: string[];
  alt: string;
}

export function ProductImageSlider({ images, alt }: ProductImageSliderProps) {
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [translateX, setTranslateX] = useState(100);
  
  // Usamos refs para evitar problemas de closure
  const displayedIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const rafRef = useRef<number | null>(null);

  // Sincronizar ref con state
  useEffect(() => {
    displayedIndexRef.current = displayedIndex;
  }, [displayedIndex]);

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const slideToIndex = (targetIndex: number, fromRight: boolean) => {
    if (isAnimatingRef.current || targetIndex === displayedIndexRef.current) return;
    
    isAnimatingRef.current = true;
    const startX = fromRight ? 100 : -100;
    setTranslateX(startX);
    setIncomingIndex(targetIndex);

    const duration = 500;
    const startTime = performance.now();
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const x = startX * (1 - easeOut(progress));
      setTranslateX(x);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        // Animación completa
        setDisplayedIndex(targetIndex);
        displayedIndexRef.current = targetIndex;
        setIncomingIndex(null);
        setTranslateX(100);
        isAnimatingRef.current = false;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
  };

  const goNext = () => {
    const next = (displayedIndexRef.current + 1) % images.length;
    slideToIndex(next, true);
  };

  const goPrev = () => {
    const prev = (displayedIndexRef.current - 1 + images.length) % images.length;
    slideToIndex(prev, false);
  };

  const startAutoSlide = () => {
    if (images.length <= 1) return;
    stopAutoSlide();
    intervalRef.current = setInterval(() => {
      if (!isAnimatingRef.current) {
        goNext();
      }
    }, 4000);
  };

  const handlePrev = () => {
    stopAutoSlide();
    goPrev();
    startAutoSlide();
  };

  const handleNext = () => {
    stopAutoSlide();
    goNext();
    startAutoSlide();
  };

  const handleDotClick = (index: number) => {
    if (index === displayedIndexRef.current || isAnimatingRef.current) return;
    stopAutoSlide();
    slideToIndex(index, index > displayedIndexRef.current);
    startAutoSlide();
  };

  useEffect(() => {
    startAutoSlide();
    return () => {
      stopAutoSlide();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
        <span className="text-gray-400">Sin imagen</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative w-full aspect-square bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0]}
          alt={alt}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square bg-gray-100 group overflow-hidden">
      {/* Imagen de fondo (la actual) - NO cambia durante la animación */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[displayedIndex]}
          alt={`${alt} - ${displayedIndex + 1}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Imagen entrante que se desliza desde derecha/izquierda */}
      {incomingIndex !== null && (
        <div 
          className="absolute inset-0 will-change-transform"
          style={{ transform: `translateX(${translateX}%)` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[incomingIndex]}
            alt={`${alt} - ${incomingIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Flechas */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDotClick(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === displayedIndex 
                ? 'bg-white scale-110' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
