'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface BossBattleIntroProps {
  open: boolean;
  onComplete: () => void;
  rankName: string;
  sigilName: string;
}

export default function BossBattleIntro({ open, onComplete, rankName, sigilName }: BossBattleIntroProps) {
  const [phase, setPhase] = useState<'intro' | 'boss' | 'sigil' | 'ready'>('intro');

  useEffect(() => {
    if (!open) return;

    const timer1 = setTimeout(() => setPhase('boss'), 2000);
    const timer2 = setTimeout(() => setPhase('sigil'), 4000);
    const timer3 = setTimeout(() => setPhase('ready'), 6000);
    const timer4 = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [open, onComplete]);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl border-none bg-black/95" showCloseButton={false}>
        <div className="relative h-[500px] flex items-center justify-center overflow-hidden">
          {/* Background effects */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-900 via-pink-900 to-red-900"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />

          {/* Phase 1: Intro */}
          <AnimatePresence>
            {phase === 'intro' && (
              <motion.div
                key="intro"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 1 }}
              >
                <motion.h1
                  className="text-6xl font-bold text-white"
                  initial={{ opacity: 0, y: -50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  BOSS BATTLE
                </motion.h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 2: Boss */}
          <AnimatePresence>
            {phase === 'boss' && (
              <motion.div
                key="boss"
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <motion.div
                  className="text-8xl mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  👹
                </motion.div>
                <motion.h2
                  className="text-4xl font-bold text-white"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  {rankName} BOSS
                </motion.h2>
                <motion.p
                  className="text-xl text-gray-300 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                >
                  HP: 130
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 3: Sigil */}
          <AnimatePresence>
            {phase === 'sigil' && (
              <motion.div
                key="sigil"
                className="absolute inset-0 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <motion.div
                  className="text-6xl mb-4"
                  initial={{ scale: 0, y: -100 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                >
                  ✨
                </motion.div>
                <motion.h2
                  className="text-3xl font-bold text-white"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                >
                  Sigil Active
                </motion.h2>
                <motion.p
                  className="text-xl text-purple-300 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                >
                  {sigilName}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Phase 4: Ready */}
          <AnimatePresence>
            {phase === 'ready' && (
              <motion.div
                key="ready"
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              >
                <motion.h1
                  className="text-5xl font-bold text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  BEGIN BATTLE!
                </motion.h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Particle effects */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0,
                }}
                animate={{
                  y: [null, Math.random() * window.innerHeight],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: Math.random() * 2 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

