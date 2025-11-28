'use client'

import React from "react"

import { cn } from "@/lib/utils"
import { Board, Position } from "@/types"

interface GameBoardProps {
  board: Board
  onCellClick?: (position: Position) => void
  selectedCells?: Position[]
  disabled?: boolean
}

export default function GameBoard({
  board,
  onCellClick,
  selectedCells = [],
  disabled = false,
}: GameBoardProps) {
  const boardWidth = board.width || board.size
  const boardHeight = board.height || board.size
  const isSelected = (row: number, col: number): boolean => {
    return selectedCells.some((pos) => pos.row === row && pos.col === col)
  }

  const hasCorruptedSquares = board.cells.some((row) =>
    row.some((cell) => cell.isCorrupted)
  )

  const getCellClasses = (row: number, col: number) => {
    const cell = board.cells[row][col]
    const selected = isSelected(row, col)
    const center = cell.isCenter
    const hasLetter = cell.letter !== null
    const newlyPlaced = cell.isNewlyPlaced
    const corrupted = cell.isCorrupted

    return cn(
      "board-tile",
      center && !corrupted && "board-tile--center",
      hasLetter && "board-tile--occupied",
      selected && "board-tile--selected",
      newlyPlaced && "board-tile--new",
      corrupted && "board-tile--corrupted",
      !disabled && onCellClick && "board-tile--interactive",
      disabled && "board-tile--disabled"
    )
  }

  const renderEmptyGlyph = (cell: Board["cells"][number][number]) => {
    if (cell.isCorrupted) return "✖"
    if (cell.isCenter) return "★"
    return "·"
  }

  return (
    <div className="board-shell">
      <div className="board-surface" data-disabled={disabled}>
        <span className="board-surface__glyph glyph--tl" aria-hidden="true" />
        <span className="board-surface__glyph glyph--br" aria-hidden="true" />
        <div
          className="board-surface__grid"
          style={{ gridTemplateColumns: `repeat(${boardWidth}, minmax(0, 1fr))` }}
        >
          {board.cells.slice(0, boardHeight).map((row, rowIdx) =>
            row.slice(0, boardWidth).map((cell, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={getCellClasses(rowIdx, colIdx)}
                onClick={() =>
                  !disabled && onCellClick?.({ row: rowIdx, col: colIdx })
                }
                aria-label={
                  cell.letter
                    ? `${cell.letter.char} worth ${cell.letter.points} points`
                    : cell.isCenter
                      ? "Center sigil"
                      : cell.isCorrupted
                        ? "Corrupted tile"
                        : "Empty tile"
                }
              >
                {cell.letter ? (
                  <div
                    className="tile-letter"
                    style={{
                      boxShadow: `0 0 ${Math.min(
                        18,
                        4 + (cell.letter.points ?? 1) * 1.25
                      )}px rgba(255, 179, 0, 0.45)`,
                    }}
                  >
                    <span className="tile-letter__char">{cell.letter.char}</span>
                    <span className="tile-letter__points">
                      {cell.letter.points}
                    </span>
                  </div>
                ) : (
                  <span className="tile-glyph">{renderEmptyGlyph(cell)}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="board-legend">
        <div className="board-legend__item">
          <span className="board-legend__swatch board-legend__swatch--center" />
          Center sigil
        </div>
        {hasCorruptedSquares && (
          <div className="board-legend__item">
            <span className="board-legend__swatch board-legend__swatch--corrupted" />
            Corrupted (blocked)
          </div>
        )}
      </div>
    </div>
  )
}

