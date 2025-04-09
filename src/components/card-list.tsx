'use client';

import Link from 'next/link';
import { Card } from '@/components/ui-migrated/card';
import { AnalysisBadge } from '@/components/analysis-badge';

interface CardListProps {
  cards: Array<{
    id: string;
    name: string;
    year: string;
    manufacturer: string;
    grade?: string;
    status: string;
    purchase_price?: number;
    target_price?: number;
    card_analyses?: Array<{
      analyzed_at: string;
      quality_assessment: {
        quality: 'poor' | 'fair' | 'good' | 'excellent';
        confidence: number;
      };
    }>;
  }>;
}

export function CardList({ cards }: CardListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => {
        const latestAnalysis = card.card_analyses?.[0];

        return (
          <Link key={card.id} href={`/cards/${card.id}`}>
            <Card className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{card.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {card.year} {card.manufacturer}
                  </p>
                  {card.grade && (
                    <p className="mt-1 text-sm">Grade: {card.grade}</p>
                  )}
                </div>
                {latestAnalysis && (
                  <AnalysisBadge
                    quality={latestAnalysis.quality_assessment.quality}
                    confidence={latestAnalysis.quality_assessment.confidence}
                  />
                )}
              </div>
              <div className="mt-4 flex justify-between text-sm">
                <span className="font-medium">{card.status}</span>
                {card.purchase_price && (
                  <span>${card.purchase_price.toFixed(2)}</span>
                )}
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
} 