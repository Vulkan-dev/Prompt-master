import React, { useState } from "react";
import { Globe, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "../../../components/ui/textarea";
import { useAutoResizeTextarea } from "../../hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";

interface AIInputSearchProps {
  placeholder?: string;
  searchLabel?: string;
  showEnhanceToggle?: boolean;
  onSubmit?: (value: string) => void;
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
}

export default function AI_Input_Search({
  placeholder = "Enter your prompt instruction for KernelX...",
  searchLabel = "Enhance Mode",
  showEnhanceToggle = true,
  onSubmit,
  value: externalValue,
  onChange: externalOnChange,
  className,
}: AIInputSearchProps) {
  const [internalValue, setInternalValue] = useState("");
  const value = externalValue !== undefined ? externalValue : internalValue;

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 110,
    maxHeight: 320,
  });
  const [showSearch, setShowSearch] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  const handleTextChange = (val: string) => {
    if (externalOnChange) {
      externalOnChange(val);
    } else {
      setInternalValue(val);
    }
    adjustHeight();
  };

  const handleSubmit = () => {
    if (!value.trim()) return;
    onSubmit?.(value);
  };

  const handleContainerClick = () => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className={cn("w-full max-w-full overflow-hidden", className)}>
      <div className="relative mx-auto w-full">
        <div
          aria-label="Search input container"
          className={cn(
            "relative flex w-full cursor-text flex-col rounded-2xl text-left transition-all duration-200 bg-zinc-900/90 border border-white/20 shadow-xl",
            isFocused && "ring-2 ring-indigo-500 border-indigo-400 rich-glow"
          )}
          onClick={handleContainerClick}
          role="textbox"
          tabIndex={0}
        >
          <div className="max-h-[clamp(200px,30vh,360px)] overflow-y-auto w-full">
            <Textarea
              className="w-full resize-none rounded-2xl rounded-b-none border-none bg-transparent px-[clamp(1rem,2vw,2rem)] py-[clamp(0.85rem,1.8vh,1.5rem)] leading-relaxed text-slate-100 placeholder:text-slate-400 font-mono text-[clamp(0.85rem,1.1vw,1.15rem)] focus-visible:ring-0"
              id="kernelx-ai-input"
              onBlur={() => setIsFocused(false)}
              onChange={(e) => handleTextChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={placeholder}
              ref={textareaRef}
              value={value}
            />
          </div>

          <div className="min-h-[clamp(52px,6vh,64px)] py-2.5 rounded-b-2xl border-t border-white/15 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 px-[clamp(1rem,2vw,2rem)]">
            <div className="flex items-center gap-2">
              {showEnhanceToggle ? (
                <button
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-full border px-[clamp(0.75rem,1.5vw,1.25rem)] text-[clamp(0.75rem,1vw,1.05rem)] font-mono transition-all min-h-[clamp(36px,4.5vh,48px)]",
                    showSearch
                      ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-300 font-semibold"
                      : "border-white/20 bg-white/10 text-slate-300 hover:text-white"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSearch(!showSearch);
                  }}
                  type="button"
                >
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                    <motion.div
                      animate={{
                        rotate: showSearch ? 180 : 0,
                        scale: showSearch ? 1.1 : 1,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 25,
                      }}
                    >
                      <Globe
                        className={cn(
                          "h-3.5 w-3.5",
                          showSearch ? "text-indigo-300" : "text-inherit"
                        )}
                      />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {showSearch && (
                      <motion.span
                        animate={{ width: "auto", opacity: 1 }}
                        className="shrink-0 overflow-hidden whitespace-nowrap text-[clamp(0.75rem,1vw,1.05rem)] text-indigo-300 font-semibold"
                        exit={{ width: 0, opacity: 0 }}
                        initial={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {searchLabel}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                className={cn(
                  "flex items-center gap-2 rounded-xl px-[clamp(1rem,2vw,2rem)] py-2.5 min-h-[clamp(42px,5vh,52px)] text-[clamp(0.75rem,1vw,1.05rem)] font-mono font-bold transition-all shadow-lg",
                  value.trim()
                    ? "bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer"
                    : "bg-white/15 text-slate-400 cursor-not-allowed"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit();
                }}
                disabled={!value.trim()}
                type="button"
              >
                <span>Execute Kernel</span>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
