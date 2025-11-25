'use client'

import Link from "next/link"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { useParticleEmitter } from "@/hooks/useParticleEmitter"

const pulseVariants = {
  initial: { scale: 0.98, opacity: 0.85 },
  animate: {
    scale: [1, 1.02, 1],
    opacity: [0.95, 1, 0.95],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
}

const MotionLink = motion(Link)

export function QuickPlayButton() {
  const { emit } = useParticleEmitter({
    colors: ["#00D9FF", "#FFB300", "#9D4EDD"],
    count: 16,
    spread: 140,
  })

  const handleBurst = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    emit({ x: event.clientX, y: event.clientY })
  }

  return (
    <Button asChild className="ancient-cta" size="lg">
      <MotionLink
        href="/game"
        className="ancient-cta__link"
        variants={pulseVariants}
        initial="initial"
        animate="animate"
        onMouseEnter={handleBurst}
        onClick={handleBurst}
      >
        <span>Quick Play</span>
        <span className="ancient-cta__subtitle">Seize the arena</span>
      </MotionLink>
    </Button>
  )
}

