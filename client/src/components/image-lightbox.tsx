import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [scale, setScale] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const minSwipeDistance = 50;
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const goToPrevious = useCallback(() => {
    if (isAnimating || !hasMultipleImages) return;
    setIsAnimating(true);
    setSlideDirection("right");
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      setScale(1);
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection(null);
      }, 50);
    }, 150);
  }, [isAnimating, hasMultipleImages, images.length]);

  const goToNext = useCallback(() => {
    if (isAnimating || !hasMultipleImages) return;
    setIsAnimating(true);
    setSlideDirection("left");
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      setScale(1);
      setTimeout(() => {
        setIsAnimating(false);
        setSlideDirection(null);
      }, 50);
    }, 150);
  }, [isAnimating, hasMultipleImages, images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToPrevious, goToNext, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scale > 1) return;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (scale > 1) return;
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isSwipeLeft = distance > minSwipeDistance;
    const isSwipeRight = distance < -minSwipeDistance;
    
    if (isSwipeLeft && hasMultipleImages) {
      goToNext();
    } else if (isSwipeRight && hasMultipleImages) {
      goToPrevious();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const toggleZoom = () => {
    setScale((prev) => (prev === 1 ? 2 : 1));
  };

  const getImageUrl = (url: string) => {
    return url.startsWith('/objects/') ? url : `/objects/${url}`;
  };

  const getAnimationClass = () => {
    if (!slideDirection) return "translate-x-0 opacity-100";
    if (slideDirection === "left") return "-translate-x-8 opacity-0";
    return "translate-x-8 opacity-0";
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      ref={containerRef}
      data-testid="lightbox-container"
    >
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
        onClick={onClose}
        data-testid="button-lightbox-close"
      >
        <X className="w-6 h-6" />
      </Button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
        {currentIndex + 1} / {images.length}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="text-white hover:bg-white/20"
          onClick={toggleZoom}
          data-testid="button-lightbox-zoom"
        >
          {scale > 1 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </Button>
      </div>

      {hasMultipleImages && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
            onClick={goToPrevious}
            disabled={isAnimating}
            data-testid="button-lightbox-prev"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
            onClick={goToNext}
            disabled={isAnimating}
            data-testid="button-lightbox-next"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </>
      )}

      <div 
        className="w-full h-full flex items-center justify-center p-4 md:p-12 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          src={getImageUrl(images[currentIndex])}
          alt={`圖片 ${currentIndex + 1}`}
          className={`max-w-full max-h-full object-contain transition-all duration-150 ease-out select-none ${getAnimationClass()}`}
          style={{ 
            transform: `scale(${scale})`,
            cursor: scale > 1 ? "move" : "zoom-in"
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleZoom();
          }}
          draggable={false}
          data-testid="img-lightbox-current"
        />
      </div>

      {hasMultipleImages && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? "bg-white scale-125" 
                  : "bg-white/40 hover:bg-white/60"
              }`}
              onClick={() => {
                if (index !== currentIndex && !isAnimating) {
                  setSlideDirection(index > currentIndex ? "left" : "right");
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentIndex(index);
                    setScale(1);
                    setTimeout(() => {
                      setIsAnimating(false);
                      setSlideDirection(null);
                    }, 50);
                  }, 150);
                }
              }}
              data-testid={`button-lightbox-dot-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
