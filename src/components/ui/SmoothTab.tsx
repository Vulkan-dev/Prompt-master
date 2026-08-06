import React, { useState, useRef, useLayoutEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  color?: string;
}

interface SmoothTabProps {
  items: TabItem[];
  activeTabId: string;
  onChange: (tabId: string) => void;
  className?: string;
}

const transition = {
  duration: 0.35,
  ease: [0.32, 0.72, 0, 1],
};

export default function SmoothTab({
  items,
  activeTabId,
  onChange,
  className,
}: SmoothTabProps) {
  const [dimensions, setDimensions] = useState({ width: 0, left: 0 });
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const updateDimensions = () => {
      const selectedButton = buttonRefs.current.get(activeTabId);
      const container = containerRef.current;

      if (selectedButton && container) {
        const rect = selectedButton.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setDimensions({
          width: rect.width,
          left: rect.left - containerRect.left,
        });
      }
    };

    updateDimensions();
    const handleResize = () => requestAnimationFrame(updateDimensions);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeTabId, items]);

  return (
    <div
      aria-label="KernelX Navigation Tabs"
      className={cn(
        "relative flex items-center justify-between gap-1 p-1.5 w-full bg-zinc-900/90 rounded-2xl border border-white/20 shadow-xl overflow-hidden",
        className
      )}
      ref={containerRef}
      role="tablist"
    >
      {/* Sliding Background Indicator Pill */}
      {dimensions.width > 0 && (
        <motion.div
          animate={{
            width: dimensions.width - 8,
            x: dimensions.left + 4,
            opacity: 1,
          }}
          className="absolute z-[1] rounded-xl bg-indigo-600 shadow-md"
          initial={false}
          style={{ height: "calc(100% - 8px)", top: "4px" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 32,
          }}
        />
      )}

      <div className="relative z-[2] grid w-full grid-cols-3 gap-1 sm:gap-2">
        {items.map((item) => {
          const isSelected = activeTabId === item.id;
          return (
            <button
              aria-selected={isSelected}
              className={cn(
                "relative flex items-center justify-center gap-2 rounded-xl py-[clamp(0.6rem,1.4vh,1rem)] px-[clamp(0.5rem,1.5vw,1.5rem)] min-h-[clamp(42px,5vh,54px)]",
                "font-mono text-[clamp(0.75rem,1.1vw,1.1rem)] font-bold transition-colors duration-200 cursor-pointer select-none",
                "focus-visible:outline-none",
                isSelected
                  ? "text-white"
                  : "text-slate-300 hover:text-white"
              )}
              id={`tab-${item.id}`}
              key={item.id}
              onClick={() => onChange(item.id)}
              ref={(el) => {
                if (el) buttonRefs.current.set(item.id, el);
                else buttonRefs.current.delete(item.id);
              }}
              role="tab"
              type="button"
            >
              {item.icon}
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
