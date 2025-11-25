import React from 'react';
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HealthBarProps {
  playerName: string;
  currentHp: number;
  maxHp: number;
  isPlayer?: boolean;
}

export default function HealthBar({ playerName, currentHp, maxHp, isPlayer = false }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const hpColor = percentage > 60 ? 'bg-green-500' : percentage > 30 ? 'bg-yellow-500' : 'bg-red-500';
  
  return (
    <Card className={isPlayer ? 'border-blue-500' : 'border-red-500'}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          <span>{playerName}</span>
          <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
            {currentHp} / {maxHp} HP
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <ProgressPrimitive.Root
            className="bg-gray-200 dark:bg-gray-800 relative h-4 w-full overflow-hidden rounded-full"
          >
            <ProgressPrimitive.Indicator
              className={cn(
                "h-full w-full flex-1 transition-all",
                hpColor
              )}
              style={{ transform: `translateX(-${100 - percentage}%)` }}
            />
          </ProgressPrimitive.Root>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Health</span>
            <span className="font-semibold">{Math.round(percentage)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

