'use client';

import Link from 'next/link';
import { 
  CreditCard,
  TrendingUp,
  Award,
  DollarSign,
  BarChart4,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icon mapping
const iconMap = {
  CreditCard,
  TrendingUp,
  Award,
  DollarSign,
  BarChart4
};

export type StatIconName = keyof typeof iconMap;

interface StatCardProps {
  title: string;
  value: string | number;
  href: string;
  iconName: StatIconName;
  description?: string;
  accentColor?: 'default' | 'blue' | 'green' | 'red' | 'orange';
  className?: string;
}

export function StatCard({
  title,
  value,
  href,
  iconName,
  description,
  accentColor = 'default',
  className,
}: StatCardProps) {
  // Get the icon component from our mapping
  const Icon = iconMap[iconName];

  // Define color classes based on accentColor
  const accentClasses = {
    default: 'border-gray-200 hover:border-gray-300',
    blue: 'border-blue-100 hover:border-blue-200 bg-blue-50',
    green: 'border-green-100 hover:border-green-200 bg-green-50',
    red: 'border-red-100 hover:border-red-200 bg-red-50',
    orange: 'border-orange-100 hover:border-orange-200 bg-orange-50',
  };

  const iconColors = {
    default: 'text-gray-500',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    orange: 'text-orange-600',
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href} className="block">
            <Card 
              className={cn(
                'border transition-all duration-200 hover:shadow-md', 
                accentClasses[accentColor],
                className
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">
                    {title}
                  </div>
                  {Icon && <Icon className={cn('h-5 w-5', iconColors[accentColor])} />}
                </div>
                <div className="mt-2 text-2xl font-bold">
                  {value}
                </div>
                {description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {description}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to view {title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 