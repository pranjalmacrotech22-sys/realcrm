"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  // When pathname or searchParams change, navigation finished
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        setProgress(0);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  // Intercept internal link clicks to trigger progress bar immediately
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore external links, new tabs, hash links, mailto, etc.
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        target.getAttribute("target") === "_blank" ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      ) {
        return;
      }

      // Check if navigating to a different page
      const currentUrl = window.location.pathname + window.location.search;
      if (href !== currentUrl) {
        setIsNavigating(true);
        setProgress(25);

        // Progressively advance bar while waiting
        const t1 = setTimeout(() => setProgress(65), 150);
        const t2 = setTimeout(() => setProgress(85), 400);

        // Safety fallback: reset after 4s
        const t3 = setTimeout(() => {
          setIsNavigating(false);
          setProgress(0);
        }, 4000);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 shadow-xs shadow-blue-500/80 transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: "width, opacity",
        }}
      />
    </div>
  );
}
