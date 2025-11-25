'use client'

import { useCallback } from "react"

import {
  emitParticleBurst,
  type ParticleBurstOptions,
  type ParticleBurstPoint,
} from "@/lib/effects/particleSystem"

type EmitArg = ParticleBurstPoint | null

export function useParticleEmitter(defaultOptions?: ParticleBurstOptions) {
  const emit = useCallback(
    (arg?: EmitArg, overrides?: ParticleBurstOptions) => {
      if (!arg) return
      emitParticleBurst(arg, { ...defaultOptions, ...overrides })
    },
    [defaultOptions]
  )

  return { emit }
}

