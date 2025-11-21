'use client';

import React from 'react';
import { Board, Position } from '@/types';

interface GameBoardProps {
  board: Board;
  onCellClick?: (position: Position) => void;
  selectedCells?: Position[];
  disabled?: boolean;
}

export default function GameBoard({
  board,
  onCellClick,
  selectedCells = [],
  disabled = false,
}: GameBoardProps) {
  const isSelected = (row: number, col: number): boolean => {
    return selectedCells.some(pos => pos.row === row && pos.col === col);
  };

  const getCellClasses = (row: number, col: number) => {
    const cell = board.cells[row][col];
    const selected = isSelected(row, col);
    const center = cell.isCenter;
    const hasLetter = cell.letter !== null;
    const newlyPlaced = cell.isNewlyPlaced;

    return `
      w-12 h-12 border-2 rounded-md
      flex items-center justify-center
      font-bold text-lg
      transition-all duration-200
      ${center ? 'bg-yellow-100 dark:bg-yellow-900 border-yellow-500' : ''}
      ${hasLetter ? 'bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}
      ${selected ? 'ring-4 ring-blue-500 dark:ring-blue-400' : ''}
      ${newlyPlaced ? 'animate-pulse bg-green-100 dark:bg-green-900' : ''}
      ${!disabled && onCellClick ? 'cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-800' : ''}
      ${disabled ? 'cursor-not-allowed opacity-75' : ''}
    `;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid grid-cols-8 gap-1 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg shadow-lg">
        {board.cells.map((row, rowIdx) =>
          row.map((cell, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={getCellClasses(rowIdx, colIdx)}
              onClick={() => !disabled && onCellClick?.({ row: rowIdx, col: colIdx })}
              title={cell.isCenter ? 'Center' : ''}
            >
              {cell.letter ? (
                <div className="flex flex-col items-center">
                  <span className="text-xl">{cell.letter.char}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {cell.letter.points}
                  </span>
                </div>
              ) : (
                <span className="text-gray-400 dark:text-gray-600 text-xs">
                  {cell.isCenter ? '★' : ''}
                </span>
              )}
            </div>
          ))
        )}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        <span className="inline-block w-3 h-3 bg-yellow-100 dark:bg-yellow-900 border-yellow-500 border-2 rounded mr-1"></span>
        Center
      </div>
    </div>
  );
}

