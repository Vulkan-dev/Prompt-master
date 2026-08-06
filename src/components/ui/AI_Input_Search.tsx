import React, { useState } from "react";
import { Globe, Send } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "../../../components/ui/textarea";
import { useAutoResizeTextarea } from "../../hooks/use-auto-resize-textarea";
import { cn } from "@/lib/utils";

interface AIInputSearchProps {
  placeholder?: string;
  searchLabel?: string;
  onSubmit?: (value: string) => void;
  value?: string;
  onChange?: (val: string) => void;
  className?: string;
}

export default function AI_Input_Search({
  placeholder = "Enter your prompt instruction for KernelX...",
  searchLabel = "Enhance Mode",
  onSubmit,
  value: externalValue,
  onChange: externalOnChange,
  className,
}: AIInputSearchProps) {
  const [internalValue, setInternalValue] = useState("");
  const value = externalValue !== undefined ? externalValue : internalValue;

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 80,
    maxHeight: 260,
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
            "relative flex w-full cursor-text flex-col rounded-2xl text-left transition-all duration-200 glass-card border border-white/15",
            isFocused && "ring-2 ring-primary/50 border-primary rich-glow"
          )}
          onClick={handleContainerClick}
          role="textbox"
          tabIndex={0}
        >
          <div className="max-h-[260px] overflow-y-auto w-full">
            <Textarea
              className="w-full resize-none rounded-2xl rounded-b-none border-none bg-transparent px-4 sm:px-5 py-3 sm:py-4 leading-relaxed text-foreground placeholder:text-foreground/40 font-mono text-xs sm:text-sm focus-visible:ring-0"
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

          <div className="min-h-[52px] py-2 rounded-b-2xl border-t border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4">
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-mono transition-all min-h-[36px]",
                  showSearch
                    ? "border-primary/40 bg-primary/15 text-primary font-medium"
                    : "border-white/10 bg-white/5 text-white/60 hover:text-white"
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
                        showSearch ? "text-primary" : "text-inherit"
                      )}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showSearch && (
                    <motion.span
                      animate={{ width: "auto", opacity: 1 }}
                      className="shrink-0 overflow-hidden whitespace-nowrap text-xs text-primary font-medium"
                      exit={{ width: 0, opacity: 0 }}
                      initial={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {searchLabel}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 min-h-[40px] text-xs font-mono font-medium transition-all shadow-md",
                  value.trim()
                    ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubmit();
                }}
                disabled={!value.trim()}
                type="button"
              >
                <span>Execute Kernel</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
