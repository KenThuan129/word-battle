import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Word Battle
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            A vocabulary-learning word-building strategy game. Compete against AI opponents on an 8×8 grid,
            placing words crossword-style.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>🎯 Journey Mode</CardTitle>
              <CardDescription>Campaign with story-driven vocabulary learning</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/journey">
                <Button className="w-full">Start Journey</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>⚔️ PvE Arena</CardTitle>
              <CardDescription>Fight AI opponents with increasing difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/arena">
                <Button className="w-full" variant="outline">Enter Arena</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>📅 Daily Challenges</CardTitle>
              <CardDescription>3 puzzles daily to earn keys</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/daily">
                <Button className="w-full" variant="outline">View Challenges</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>📚 Word Bank</CardTitle>
              <CardDescription>View your collected vocabulary</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/wordbank">
                <Button className="w-full" variant="outline">View Words</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/game">
            <Button size="lg" className="text-lg px-8 py-6">
              Quick Play
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
