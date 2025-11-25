import Link from "next/link"

import { QuickPlayButton } from "@/components/landing/QuickPlayButton"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const modeCards = [
  {
    title: "Journey Mode",
    glyph: "⟁",
    description: "Story-driven trials across ancient tech ruins.",
    action: "Begin Journey",
    href: "/journey",
    accent: "amber",
  },
  {
    title: "PvE Arena",
    glyph: "⚔",
    description: "Battle adaptive guardians with scaling AI.",
    action: "Enter Arena",
    href: "/arena",
    accent: "cyan",
  },
  {
    title: "Daily Challenges",
    glyph: "✦",
    description: "Three rotating puzzles reward mastery keys.",
    action: "View Challenges",
    href: "/daily",
    accent: "verdigris",
  },
  {
    title: "Word Bank",
    glyph: "⌘",
    description: "Curate discovered vocabulary & lore.",
    action: "Open Codex",
    href: "/wordbank",
    accent: "purple",
  },
]

export default function Home() {
  return (
    <div className="ancient-landing">
      <div className="ancient-landing__layers" aria-hidden="true">
        <span className="ancient-landing__fragment fragment--left" />
        <span className="ancient-landing__fragment fragment--right" />
        <span className="ancient-landing__stars" />
      </div>

      <main className="ancient-shell">
        <section className="ancient-hero">
          <p className="ancient-hero__tag">Arcane Lexicon Interface v2.0</p>
          <h1 className="ancient-title">
            Word <span>Battle</span>
          </h1>
          <p className="ancient-hero__subtitle">
            Unlock forgotten dialects carved into bronze tablets while wielding
            neon circuitry. Choose your mode, channel the sigils, and conquer
            the board.
          </p>
        </section>

        <section className="ancient-card-grid">
          {modeCards.map((card) => (
            <Card
              key={card.title}
              className={`ancient-panel ancient-panel--interactive ancient-panel--${card.accent}`}
            >
              <CardHeader className="ancient-panel__header">
                <div className="ancient-panel__glyph" aria-hidden="true">
                  {card.glyph}
                </div>
                <CardTitle>{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href={card.href}>
                  <Button
                    variant="ghost"
                    className="ancient-panel__action"
                    aria-label={card.action}
                  >
                    <span>{card.action}</span>
                    <span className="ancient-panel__action-glow" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </section>

        <div className="ancient-quickplay" aria-live="polite">
          <QuickPlayButton />
        </div>
      </main>
    </div>
  )
}
