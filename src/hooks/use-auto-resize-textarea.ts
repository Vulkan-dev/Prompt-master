import { useRef, useCallback } from "react";

interface UseAutoResizeTextareaProps {
  minHeight?: number;
  maxHeight?: number;
}

export function useAutoResizeTextarea({
  minHeight = 52,
  maxHeight = 200,
}: UseAutoResizeTextareaProps = {}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const scrollHeight = textarea.scrollHeight;

      if (maxHeight && scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
      } else {
        textarea.style.height = `${Math.max(scrollHeight, minHeight)}px`;
      }
    },
    [minHeight, maxHeight]
  );

  return { textareaRef, adjustHeight };
}
