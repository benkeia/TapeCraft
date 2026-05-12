/**
 * Responsive Design System
 * Breakpoints and hooks for mobile-first responsive design
 */

import React from 'react';

export const breakpoints = {
  mobile: 480,
  mobileLg: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1920,
} as const;

export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.mobile - 1}px)`,
  mobileLg: `(max-width: ${breakpoints.mobileLg - 1}px)`,
  tablet: `(max-width: ${breakpoints.tablet - 1}px)`,
  desktop: `(min-width: ${breakpoints.tablet}px)`,
  desktopLg: `(min-width: ${breakpoints.desktop}px)`,
  wide: `(min-width: ${breakpoints.wide}px)`,
} as const;

/**
 * Hook to detect current breakpoint
 * Returns a string indicating the current breakpoint
 */
export function useBreakpoint(): 'mobile' | 'mobileLg' | 'tablet' | 'desktop' | 'desktopLg' {
  const [breakpoint, setBreakpoint] = React.useState<'mobile' | 'mobileLg' | 'tablet' | 'desktop' | 'desktopLg'>('desktop');

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= breakpoints.mobile) {
        setBreakpoint('mobile');
      } else if (width <= breakpoints.mobileLg) {
        setBreakpoint('mobileLg');
      } else if (width <= breakpoints.tablet) {
        setBreakpoint('tablet');
      } else if (width <= breakpoints.desktop) {
        setBreakpoint('desktopLg');
      } else {
        setBreakpoint('desktop');
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

/**
 * Hook to check if screen is mobile
 */
export function useMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile' || breakpoint === 'mobileLg';
}

/**
 * Hook to check if screen is tablet or smaller
 */
export function useTabletOrSmaller(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === 'mobile' || breakpoint === 'mobileLg' || breakpoint === 'tablet';
}
