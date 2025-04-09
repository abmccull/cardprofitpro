'use client';

import { useRef } from 'react';
import { Card } from '@/components/ui-migrated/card';
import { Button } from '@/components/ui-migrated/button';
import { Skeleton } from '@/components/ui-migrated/skeleton';
import { useCardAnalysis } from '@/hooks/use-card-analysis';

interface CardAnalysisProps {
  cardId: string;
}

export function CardAnalysis({ cardId }: CardAnalysisProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAnalyzing, analysis, analyzeImage } = useCardAnalysis(cardId);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzeImage(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button onClick={handleUploadClick} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Upload Image for Analysis'}
        </Button>
      </div>

      {isAnalyzing && (
        <Card className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Card>
      )}

      {analysis && !isAnalyzing && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Quality Assessment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Quality</p>
                <p className="font-medium capitalize">{analysis.insights.quality}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="font-medium">{Math.round(analysis.insights.confidence * 100)}%</p>
              </div>
            </div>
            {analysis.insights.qualityIssues.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Issues</p>
                <ul className="list-disc list-inside">
                  {analysis.insights.qualityIssues.map((issue, i) => (
                    <li key={i} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Detected Text</h3>
            <p className="text-sm">
              {analysis.insights.detectedText.join(' ')}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Labels</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.insights.detectedLabels.map((label, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Dominant Colors</h3>
            <div className="flex gap-2">
              {analysis.insights.dominantColors.map((color, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full border"
                    style={{
                      backgroundColor: `rgb(${color.red}, ${color.green}, ${color.blue})`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 