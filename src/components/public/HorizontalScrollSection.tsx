import { useRef, useState, useEffect, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface HorizontalScrollSectionProps {
  title: string;
  linkTo?: string;
  children: ReactNode;
  className?: string;
}

export const HorizontalScrollSection = ({
  title,
  linkTo,
  children,
  className = "",
}: HorizontalScrollSectionProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    checkScrollPosition();
    container.addEventListener("scroll", checkScrollPosition);
    window.addEventListener("resize", checkScrollPosition);
    
    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className={`relative group/section py-4 ${className}`}>
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-4 md:px-6">
          {linkTo ? (
            <Link to={linkTo} className="flex items-center gap-2 group/link">
              <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover/link:text-primary transition-colors">
                {title}
              </h2>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover/link:text-primary transition-colors" />
            </Link>
          ) : (
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              {title}
            </h2>
          )}
        </div>

        {/* Scroll Container */}
        <div className="relative">
          {/* Left Navigation Arrow */}
          <button
            onClick={() => scroll("left")}
            className={`absolute left-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-r from-background via-background/80 to-transparent flex items-center justify-start pl-2 transition-opacity duration-300 ${
              canScrollLeft
                ? "opacity-0 group-hover/section:opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="bg-background/80 hover:bg-background backdrop-blur-sm p-2 rounded-full border border-border/50 hover:border-primary/50 transition-all hover:scale-110">
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </div>
          </button>

          {/* Scrollable Content */}
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 scroll-smooth"
          >
            {children}
          </div>

          {/* Right Navigation Arrow */}
          <button
            onClick={() => scroll("right")}
            className={`absolute right-0 top-0 bottom-0 z-20 w-12 bg-gradient-to-l from-background via-background/80 to-transparent flex items-center justify-end pr-2 transition-opacity duration-300 ${
              canScrollRight
                ? "opacity-0 group-hover/section:opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="bg-background/80 hover:bg-background backdrop-blur-sm p-2 rounded-full border border-border/50 hover:border-primary/50 transition-all hover:scale-110">
              <ChevronRight className="h-5 w-5 text-foreground" />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
