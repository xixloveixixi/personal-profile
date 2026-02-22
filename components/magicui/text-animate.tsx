"use client";

import { motion, useInView, Variants, type Variant } from "framer-motion";
import { useRef } from "react";

type AnimationType =
  | "fadeIn"
  | "blurIn"
  | "blurInUp"
  | "blurInDown"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleUp"
  | "scaleDown";

type SplitBy = "text" | "word" | "character" | "line";

interface TextAnimateProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
  variants?: Variants;
  as?: keyof JSX.IntrinsicElements;
  by?: SplitBy;
  startOnView?: boolean;
  once?: boolean;
  animation?: AnimationType;
}

const animations: Record<AnimationType, { hidden: Variant; visible: Variant }> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  blurIn: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
  blurInUp: {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    visible: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  blurInDown: {
    hidden: { opacity: 0, filter: "blur(10px)", y: -20 },
    visible: { opacity: 1, filter: "blur(0px)", y: 0 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
  slideDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  scaleDown: {
    hidden: { opacity: 0, scale: 1.2 },
    visible: { opacity: 1, scale: 1 },
  },
};

const splitText = (text: string, by: SplitBy): string[] => {
  switch (by) {
    case "text":
      return [text];
    case "word":
      return text.split(" ");
    case "character":
      return text.split("");
    case "line":
      return text.split("\n");
    default:
      return text.split(" ");
  }
};

const TextAnimate = ({
  children,
  className = "",
  delay = 0,
  duration = 0.3,
  variants,
  as: Component = "p",
  by = "word",
  startOnView = true,
  once = true,
  animation = "fadeIn",
}: TextAnimateProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: "-50px" });
  const isInView = !startOnView || inView;

  const textArray = splitText(children, by);
  const selectedAnimation = animations[animation];

  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: duration / textArray.length,
        delayChildren: delay,
      },
    },
  };

  const defaultItemVariants = {
    hidden: selectedAnimation.hidden,
    visible: {
      ...selectedAnimation.visible,
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  } satisfies Variants;

  const itemVariants: Variants = variants ?? defaultItemVariants;

  const MotionComponent = motion.create(Component as any);

  return (
    <MotionComponent
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {textArray.map((item, index) => (
        <motion.span
          key={index}
          variants={itemVariants}
          className="inline-block"
          style={{ whiteSpace: by === "line" ? "pre-wrap" : "pre" }}
        >
          {item}
          {by === "word" && index < textArray.length - 1 && "\u00A0"}
        </motion.span>
      ))}
    </MotionComponent>
  );
};

export { TextAnimate };
