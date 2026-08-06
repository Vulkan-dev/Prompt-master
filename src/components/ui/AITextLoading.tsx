import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AITextLoadingProps {
  texts?: string[];
  className?: string;
  interval?: number;
}

export default function AITextLoading({
  texts = [
    "KernelX Analyzing Prompt...",
    "Evaluating Quality Criteria...",
    "Scanning Injection Vulnerabilities...",
    "Optimizing Neural Instruction...",
    "Finalizing Production Output...",
  ],
  className,
  interval = 1600,
}: AITextLoadingProps) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [interval, texts.length]);

  return (
    <div className="flex items-center justify-center p-6">
      <motion.div
        animate={{ opacity: 1 }}
        className="relative w-full px-4 py-2 text-center"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            animate={{
              opacity: 1,
              y: 0,
              backgroundPosition: ["200% center", "-200% center"],
            }}
            className={cn(
              "inline-flex justify-center whitespace-nowrap bg-[length:200%_100%] bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text font-bold text-xl md:text-2xl text-transparent font-mono tracking-tight",
              className
            )}
            exit={{ opacity: 0, y: -16 }}
            initial={{ opacity: 0, y: 16 }}
            key={currentTextIndex}
            transition={{
              opacity: { duration: 0.3 },
              y: { duration: 0.3 },
              backgroundPosition: {
                duration: 2.5,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              },
            }}
          >
            {texts[currentTextIndex]}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
