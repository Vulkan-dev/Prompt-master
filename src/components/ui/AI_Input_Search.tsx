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
    minHeight: 100,
    maxHeight: 280,
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
          <div className="max-h-[280px] overflow-y-auto w-full">
            <Textarea
              className="w-full resize-none rounded-2xl rounded-b-none border-none bg-transparent px-4 sm:px-6 py-4 leading-relaxed text-slate-100 placeholder:text-slate-400 font-mono text-sm sm:text-base focus-visible:ring-0"
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

          <div className="min-h-[56px] py-2.5 rounded-b-2xl border-t border-white/15 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                className={cn(
                  "flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-xs font-mono transition-all min-h-[38px]",
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
                      className="shrink-0 overflow-hidden whitespace-nowrap text-xs text-indigo-300 font-semibold"
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
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 min-h-[42px] text-xs font-mono font-bold transition-all shadow-lg",
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
