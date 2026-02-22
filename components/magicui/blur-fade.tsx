"use client";

import { motion, useInView, Variants } from "framer-motion";
import { useRef } from "react";

type InViewMargin = NonNullable<Parameters<typeof useInView>[1]>["margin"];

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: "up" | "down" | "left" | "right";
  inView?: boolean;
  inViewMargin?: InViewMargin;
  blur?: string;
}

const BlurFade = ({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  offset = 6,
  direction = "down",
  inView = false,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) => {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: inViewMargin });
  const isInView = !inView || inViewResult;

  const directionOffset = {
    up: { y: -offset },
    down: { y: offset },
    left: { x: -offset },
    right: { x: offset },
  };

  const defaultVariants: Variants = {
    hidden: {
      opacity: 0,
      filter: `blur(${blur})`,
      ...directionOffset[direction],
    },
    visible: {
      opacity: 1,
      filter: `blur(0px)`,
      y: 0,
      x: 0,
    },
  };

  const combinedVariants = variant || defaultVariants;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={combinedVariants}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export { BlurFade };
