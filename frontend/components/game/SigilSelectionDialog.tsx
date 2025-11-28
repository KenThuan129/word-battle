'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArenaSigilType } from '@/types';

export interface ArenaSigil {
  type: ArenaSigilType;
  name: string;
  description: string;
  icon: string;
}

const AVAILABLE_SIGILS: ArenaSigil[] = [
  {
    type: 'protection_of_knowledge',
    name: 'Protection of Knowledge',
    description: 'Reduce Damage Received by 1 per 3 vowels played',
    icon: '🛡️',
  },
  {
    type: 'word_blast',
    name: 'Word Blast',
    description: 'For the next 3 turns, Player has an additional 3 slots on their Hand',
    icon: '💥',
  },
  {
    type: 'overloading_process',
    name: 'Overloading Process',
    description: 'AI takes additional 4 damage for the first hit, then additional 2 damage over the next 2 turns',
    icon: '⚡',
  },
];

interface SigilSelectionDialogProps {
  open: boolean;
  onSelect: (sigilType: ArenaSigilType) => void;
  rankName: string;
}

export default function SigilSelectionDialog({ open, onSelect, rankName }: SigilSelectionDialogProps) {
  const [selectedSigil, setSelectedSigil] = useState<ArenaSigilType | null>(null);

  const handleConfirm = () => {
    if (selectedSigil) {
      onSelect(selectedSigil);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              BOSS BATTLE AWAITS
            </DialogTitle>
            <DialogDescription className="text-center text-lg mt-2">
              Choose your Sigil before facing the {rankName} Boss
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <motion.div
          className="mt-6 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {AVAILABLE_SIGILS.map((sigil, index) => (
            <motion.div
              key={sigil.type}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  selectedSigil === sigil.type
                    ? 'border-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                    : 'border-2 hover:border-purple-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedSigil(sigil.type)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <motion.div
                      className="text-5xl"
                      animate={
                        selectedSigil === sigil.type
                          ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }
                          : {}
                      }
                      transition={{ duration: 0.5 }}
                    >
                      {sigil.icon}
                    </motion.div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">{sigil.name}</CardTitle>
                      <CardDescription className="text-base mt-1">{sigil.description}</CardDescription>
                    </div>
                    {selectedSigil === sigil.type && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl"
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className="mt-6 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Button
            onClick={handleConfirm}
            disabled={!selectedSigil}
            size="lg"
            className="px-8 py-6 text-lg"
          >
            {selectedSigil ? 'Begin Battle' : 'Select a Sigil to Continue'}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

