
import { useEffect, useRef } from "react";
import { Calendar } from "lucide-react";

interface MobileCalendarNavigationProps {
  visibleDays: number[];
  formattedDates: Array<{
    date: Date;
    dayOfMonth: number;
    isToday: boolean;
  }>;
  onLoadMoreDays: (direction: 'prev' | 'next') => void;
  isAtMonthStart: boolean;
  isAtMonthEnd: boolean;
}

export function MobileCalendarNavigation({
  visibleDays,
  formattedDates,
  onLoadMoreDays,
  isAtMonthStart,
  isAtMonthEnd
}: MobileCalendarNavigationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const prevTriggerRef = useRef<HTMLDivElement>(null);
  const nextTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    
    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new intersection observer for infinite scroll
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        
        const element = entry.target;
        
        if (element === prevTriggerRef.current && !isAtMonthStart) {
          onLoadMoreDays('prev');
        } else if (element === nextTriggerRef.current && !isAtMonthEnd) {
          onLoadMoreDays('next');
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });
    
    // Observe the trigger elements
    if (prevTriggerRef.current) {
      observerRef.current.observe(prevTriggerRef.current);
    }
    
    if (nextTriggerRef.current) {
      observerRef.current.observe(nextTriggerRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleDays, isAtMonthStart, isAtMonthEnd, onLoadMoreDays]);

  return (
    <div className="flex items-center px-4 py-2 bg-muted/30 relative">
      {/* Trigger element for loading previous days */}
      <div 
        ref={prevTriggerRef} 
        className="absolute left-0 h-full w-12 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
      
      <div className="w-full overflow-x-auto py-2 scrollbar-hide" ref={scrollRef}>
        <div className="text-sm font-medium flex items-center gap-1">
          <Calendar className="h-4 w-4 shrink-0" />
          <div className="flex items-center min-w-max">
            {visibleDays.map(dayIndex => 
              <span key={dayIndex} className={`${formattedDates[dayIndex].isToday ? 'text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded' : 'px-1'}`}>
                {formattedDates[dayIndex].dayOfMonth}
              </span>
            ).reduce((prev, curr, i) => [prev, <span key={`sep-${i}`} className="text-muted-foreground mx-0.5">-</span>, curr] as any)}
          </div>
        </div>
      </div>
      
      {/* Trigger element for loading next days */}
      <div 
        ref={nextTriggerRef} 
        className="absolute right-0 h-full w-12 opacity-0 pointer-events-none"
        aria-hidden="true"
      />
      
      {/* Loading indicators */}
      {isAtMonthStart && <div className="absolute left-2 text-xs text-muted-foreground">Start</div>}
      {isAtMonthEnd && <div className="absolute right-2 text-xs text-muted-foreground">End</div>}
    </div>
  );
}
