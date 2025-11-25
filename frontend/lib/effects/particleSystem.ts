export type ParticleBurstPoint = {
  x: number
  y: number
}

export type ParticleBurstOptions = {
  count?: number
  colors?: string[]
  duration?: number
  spread?: number
  sizeRange?: [number, number]
  speedRange?: [number, number]
  zIndex?: number
}

const defaultOptions: Required<Omit<ParticleBurstOptions, "colors">> & {
  colors: string[]
} = {
  count: 12,
  colors: ["#00D9FF", "#FFB300", "#9D4EDD"],
  duration: 900,
  spread: 120,
  sizeRange: [4, 10],
  speedRange: [0.6, 1.1],
  zIndex: 60,
}

export function emitParticleBurst(
  point: ParticleBurstPoint,
  opts: ParticleBurstOptions = {}
) {
  if (typeof window === "undefined") return

  const options = {
    ...defaultOptions,
    ...opts,
    colors: opts.colors?.length ? opts.colors : defaultOptions.colors,
  }

  for (let i = 0; i < options.count; i += 1) {
    spawnParticle(point, options)
  }
}

function spawnParticle(point: ParticleBurstPoint, options: typeof defaultOptions) {
  const particle = document.createElement("span")
  const size = randomBetween(options.sizeRange)
  const color = options.colors[Math.floor(Math.random() * options.colors.length)]
  const angle = Math.random() * Math.PI * 2
  const velocity = randomBetween(options.spread) * randomBetween(options.speedRange)
  const destinationX = Math.cos(angle) * velocity
  const destinationY = Math.sin(angle) * velocity

  particle.style.position = "fixed"
  particle.style.left = `${point.x}px`
  particle.style.top = `${point.y}px`
  particle.style.width = `${size}px`
  particle.style.height = `${size}px`
  particle.style.background = color
  particle.style.borderRadius = "50%"
  particle.style.pointerEvents = "none"
  particle.style.mixBlendMode = "screen"
  particle.style.filter = "drop-shadow(0 0 6px rgba(255,255,255,0.4))"
  particle.style.zIndex = `${options.zIndex}`
  particle.style.opacity = "0.95"

  document.body.appendChild(particle)

  const animation = particle.animate(
    [
      {
        transform: "translate(-50%, -50%) scale(1)",
        opacity: 0.95,
      },
      {
        transform: `translate(${destinationX}px, ${destinationY}px) scale(0)`,
        opacity: 0,
      },
    ],
    {
      duration: options.duration,
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
      fill: "forwards",
    }
  )

  animation.onfinish = () => {
    particle.remove()
  }
}

function randomBetween(range: number | [number, number]) {
  if (Array.isArray(range)) {
    const [min, max] = range
    return Math.random() * (max - min) + min
  }
  return Math.random() * range
}

