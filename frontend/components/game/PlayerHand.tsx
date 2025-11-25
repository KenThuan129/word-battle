'use client'

import React from "react"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { Letter } from "@/types"

interface PlayerHandProps {
  letters: Letter[]
  onLetterSelect?: (letter: Letter, index: number) => void
  selectedIndices?: number[]
  disabled?: boolean
  title?: string
}

const MotionButton = motion.button

export default function PlayerHand({
  letters,
  onLetterSelect,
  selectedIndices = [],
  disabled = false,
  title = "Your Hand",
}: PlayerHandProps) {
  const isSelected = (index: number): boolean => {
    return selectedIndices.includes(index)
  }

  return (
    <div className="player-hand">
      <div className="player-hand__header">
        <h3>
          {title} <span>({letters.length})</span>
        </h3>
      </div>

      <div className="player-hand__grid">
        <AnimatePresence initial={false}>
          {letters.map((letter, index) => {
            const selected = isSelected(index)
            return (
              <MotionButton
                key={`${letter.char}-${index}`}
                layout
                layoutId={`${letter.char}-${index}`}
                disabled={disabled}
                onClick={() => !disabled && onLetterSelect?.(letter, index)}
                className={cn("runestone", selected && "runestone--selected")}
                aria-pressed={selected}
                aria-label={`${letter.char} worth ${letter.points} points`}
                whileHover={{
                  scale: disabled ? 1 : 1.08,
                  boxShadow: disabled ? "none" : "var(--glow-cyan)",
                }}
                whileTap={{ scale: disabled ? 1 : 0.96 }}
                initial={{ opacity: 0, y: 12, rotateX: -10 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: -12, rotateX: 10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                data-value={letter.points}
              >
                <span className="runestone__char">{letter.char}</span>
                <span className="runestone__value">{letter.points}</span>
                <span className="runestone__trail" aria-hidden="true" />
              </MotionButton>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

