import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface SigilDisplayProps {
  levelId: number;
  sigilCount?: number;
  activeEffects?: Array<{ type: string; damage: number; turnsRemaining: number }>;
  fiveLetterWordCount?: number;
}

export default function SigilDisplay({ 
  levelId, 
  sigilCount = 0, 
  activeEffects = [],
  fiveLetterWordCount = 0 
}: SigilDisplayProps) {
  const isLevel5 = levelId === 5;
  const isLevel10 = levelId === 10;
  
  // Level 5: activates every 3 words
  // Level 10: activates every 5 words
  const wordsUntilActivation = isLevel5 ? 3 - (sigilCount % 3) : isLevel10 ? 5 - (sigilCount % 5) : 0;
  const progressPercentage = isLevel5 
    ? ((sigilCount % 3) / 3) * 100 
    : isLevel10 
    ? ((sigilCount % 5) / 5) * 100 
    : 0;
  
  const sigilName = isLevel5 ? 'Endless Knowledge' : isLevel10 ? 'Endless Knowledge+' : 'Unknown';
  const sigilDescription = isLevel5 
    ? 'Every 3 words built: Deals 4 damage immediately + 2 damage over next 3 turns'
    : isLevel10
    ? `Every 5 words built: Deals 10 × X damage (X = ${fiveLetterWordCount} five-letter words built)`
    : '';
  
  return (
    <Card className="border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span>Sigil: {sigilName}</span>
        </CardTitle>
        <CardDescription className="text-sm mt-2">
          {sigilDescription}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">Progress to Activation</span>
            <span className="font-semibold">
              {wordsUntilActivation} word{wordsUntilActivation !== 1 ? 's' : ''} remaining
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {sigilCount} word{sigilCount !== 1 ? 's' : ''} built
          </div>
        </div>
        
        {activeEffects.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-800">
            <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Active Effects:
            </div>
            {activeEffects.map((effect, index) => (
              <div 
                key={index}
                className="text-xs bg-purple-100 dark:bg-purple-900 p-2 rounded"
              >
                <span className="font-semibold">+{effect.damage} damage</span>
                {' '}for {effect.turnsRemaining} more turn{effect.turnsRemaining !== 1 ? 's' : ''}
              </div>
            ))}
          </div>
        )}
        
        {isLevel10 && (
          <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Five-letter words built:</span> {fiveLetterWordCount}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

