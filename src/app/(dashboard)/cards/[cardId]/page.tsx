import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CardAnalysis } from '@/components/card-analysis';

interface CardDetailPageProps {
  params: {
    cardId: string;
  };
}

interface CardAnalysisRecord {
  analyzed_at: string;
  quality_assessment: {
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    confidence: number;
    issues: string[];
  };
  detected_text: string[];
  vision_analysis: {
    text: Array<{
      description: string;
      boundingBox: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    labels: Array<{
      description: string;
      confidence: number;
      relevance: number;
    }>;
  };
}

interface Card {
  id: string;
  name: string;
  year: string;
  manufacturer: string;
  grade?: string;
  status: string;
  purchase_price?: number;
  target_price?: number;
  card_analyses?: CardAnalysisRecord[];
}

async function CardDetail({ cardId }: { cardId: string }) {
  const supabase = createServerComponentClient({ cookies });

  const { data: card, error } = await supabase
    .from('cards')
    .select(`
      *,
      card_analyses (
        analyzed_at,
        quality_assessment,
        detected_text,
        vision_analysis
      )
    `)
    .eq('id', cardId)
    .single();

  if (error || !card) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">{card.name}</h2>
            <p className="text-sm text-muted-foreground">
              {card.year} {card.manufacturer}
            </p>
            {card.grade && (
              <p className="mt-2 text-sm font-medium">Grade: {card.grade}</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Status: {card.status}</p>
            {card.purchase_price && (
              <p className="text-sm">
                Purchase Price: ${card.purchase_price.toFixed(2)}
              </p>
            )}
            {card.target_price && (
              <p className="text-sm">
                Target Price: ${card.target_price.toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Card Analysis</h3>
        <CardAnalysis cardId={cardId} />
      </div>

      {card.card_analyses?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Analysis History</h3>
          <div className="space-y-4">
            {card.card_analyses.map((analysis: CardAnalysisRecord) => (
              <Card key={analysis.analyzed_at} className="p-4">
                <p className="text-sm text-muted-foreground">
                  Analyzed on {new Date(analysis.analyzed_at).toLocaleDateString()}
                </p>
                <div className="mt-2">
                  <p className="text-sm">
                    Quality: {analysis.quality_assessment.quality} (
                    {Math.round(analysis.quality_assessment.confidence * 100)}%
                    confidence)
                  </p>
                  {analysis.quality_assessment.issues.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-sm">
                      {analysis.quality_assessment.issues.map((issue: string, i: number) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CardDetailPage({ params }: CardDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      }
    >
      <CardDetail cardId={params.cardId} />
    </Suspense>
  );
} 