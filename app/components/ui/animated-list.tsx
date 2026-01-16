"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { ReactNode, useMemo } from "react";

export interface AnimatedListProps {
  className?: string;
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(({ className, children, delay = 1000 }: AnimatedListProps) => {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <AnimatePresence>
        {React.Children.map(children, (child, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            layout
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

AnimatedList.displayName = "AnimatedList";
