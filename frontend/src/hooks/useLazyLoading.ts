import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLazyLoadingOptions<T> {
  items: T[];
  pageSize: number;
  loadDelay?: number;
}

interface LazyLoadingResult<T> {
  visibleItems: T[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
}

export const useLazyLoading = <T>({
  items,
  pageSize,
  loadDelay = 300
}: UseLazyLoadingOptions<T>): LazyLoadingResult<T> => {
  const [visibleItems, setVisibleItems] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when items change
  useEffect(() => {
    setCurrentPage(0);
    setVisibleItems(items.slice(0, pageSize));
  }, [items, pageSize]);

  const hasMore = visibleItems.length < items.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Simulate loading delay for better UX
    timeoutRef.current = setTimeout(() => {
      const nextPage = currentPage + 1;
      const startIndex = nextPage * pageSize;
      const endIndex = startIndex + pageSize;
      const newItems = items.slice(0, endIndex);

      setVisibleItems(newItems);
      setCurrentPage(nextPage);
      setIsLoading(false);
    }, loadDelay);
  }, [items, pageSize, currentPage, isLoading, hasMore, loadDelay]);

  const reset = useCallback(() => {
    setCurrentPage(0);
    setVisibleItems(items.slice(0, pageSize));
    setIsLoading(false);
  }, [items, pageSize]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    visibleItems,
    isLoading,
    hasMore,
    loadMore,
    reset
  };
};

// Intersection Observer hook for automatic loading
export const useIntersectionObserver = (
  callback: () => void,
  options: IntersectionObserverInit = {}
) => {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
};