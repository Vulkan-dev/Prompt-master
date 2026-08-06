import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const GLASS_SHADOW = "shadow-[0_0_12px_rgba(0,0,0,0.4),inset_1px_1px_1px_rgba(255,255,255,0.15)]";

const liquidGlassCardVariants = cva(
  "group relative overflow-hidden bg-card/60 backdrop-blur-xl border border-white/15 rounded-2xl transition-all duration-300 max-w-full",
  {
    variants: {
      glassSize: {
        sm: "p-3 sm:p-4",
        default: "p-4 sm:p-6 md:p-8",
        lg: "p-6 sm:p-8 md:p-10",
      },
    },
    defaultVariants: {
      glassSize: "default",
    },
  }
);

export type LiquidGlassCardProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof liquidGlassCardVariants> & {
    glassEffect?: boolean;
  };

export function LiquidGlassCard({
  className,
  glassSize,
  glassEffect = true,
  children,
  ...props
}: LiquidGlassCardProps) {
  return (
    <div
      className={cn(liquidGlassCardVariants({ glassSize }), className)}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[inherit]",
          GLASS_SHADOW
        )}
      />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}

export function LiquidButton({
  className,
  children,
  onClick,
  disabled,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl font-mono text-xs font-semibold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer",
        "bg-primary text-primary-foreground hover:opacity-90",
        className
      )}
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
