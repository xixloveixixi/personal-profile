"use client";

import { cn } from "@/lib/utils";

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  shineColor?: string | string[];
  className?: string;
  children: React.ReactNode;
}

export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  shineColor = "#000000",
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          "--border-radius": `${borderRadius}px`,
          "--border-width": `${borderWidth}px`,
          "--duration": `${duration}s`,
          "--mask-linear-gradient": `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          "--background-radial-gradient": `radial-gradient(transparent,transparent, ${Array.isArray(shineColor) ? shineColor.join(",") : shineColor},transparent,transparent)`,
        } as React.CSSProperties
      }
      className={cn(
        "relative grid place-items-center rounded-[--border-radius] p-[--border-width]",
        "bg-white dark:bg-neutral-950",
        className
      )}
    >
      <div
        className={cn(
          "before:bg-shine-size before:absolute before:inset-0 before:aspect-square before:size-full before:rounded-[--border-radius] before:p-[--border-width]",
          "before:content-[''] before:[animation:shine-pulse_var(--duration)_infinite_linear]",
          "before:bg-[conic-gradient(from_var(--angle),var(--background-radial-gradient))]",
          "before:[mask:var(--mask-linear-gradient)]",
          "before:[-webkit-mask-composite:xor] before:[mask-composite:exclude]",
          "before:transition-opacity before:duration-300",
          "opacity-0 hover:opacity-100"
        )}
      />
      {children}
    </div>
  );
}
