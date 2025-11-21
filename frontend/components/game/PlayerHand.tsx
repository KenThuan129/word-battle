'use client';

import React, { useState } from 'react';
import { Letter, Position } from '@/types';

interface PlayerHandProps {
  letters: Letter[];
  onLetterSelect?: (letter: Letter, index: number) => void;
  selectedIndices?: number[];
  disabled?: boolean;
  title?: string;
}

export default function PlayerHand({
  letters,
  onLetterSelect,
  selectedIndices = [],
  disabled = false,
  title = 'Your Hand',
}: PlayerHandProps) {
  const isSelected = (index: number): boolean => {
    return selectedIndices.includes(index);
  };

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        {title} ({letters.length} letters)
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {letters.map((letter, index) => (
          <button
            key={index}
            disabled={disabled}
            onClick={() => !disabled && onLetterSelect?.(letter, index)}
            className={`
              w-14 h-14 flex flex-col items-center justify-center
              rounded-lg border-2 font-bold text-lg
              transition-all duration-200
              ${isSelected(index)
                ? 'bg-blue-500 text-white border-blue-600 ring-4 ring-blue-300 dark:ring-blue-700'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600'
              }
              ${!disabled && onLetterSelect ? 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 hover:scale-110' : ''}
              ${disabled ? 'cursor-not-allowed opacity-50' : ''}
              shadow-md hover:shadow-lg
            `}
          >
            <span>{letter.char}</span>
            <span className="text-xs">{letter.points}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

