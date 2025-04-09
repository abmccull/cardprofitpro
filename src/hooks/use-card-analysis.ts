import { useState } from 'react';
import { useToast } from '@/components/ui-migrated/use-toast';

interface CardAnalysis {
  analysis: {
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
    logos: Array<{
      description: string;
      confidence: number;
    }>;
    colors: Array<{
      rgb: {
        red: number;
        green: number;
        blue: number;
      };
      score: number;
      pixelFraction: number;
    }>;
  };
  insights: {
    detectedText: string[];
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    qualityIssues: string[];
    confidence: number;
    detectedLabels: string[];
    dominantColors: Array<{
      red: number;
      green: number;
      blue: number;
    }>;
  };
}

export function useCardAnalysis(cardId: string) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<CardAnalysis | null>(null);
  const { toast } = useToast();

  const analyzeImage = async (file: File) => {
    try {
      setIsAnalyzing(true);

      // First, upload the image to get a URL
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { url: imageUrl } = await uploadResponse.json();

      // Then, send the URL for analysis
      const analysisResponse = await fetch(`/api/cards/${cardId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze image');
      }

      const { data } = await analysisResponse.json();
      setAnalysis(data);

      toast({
        title: 'Analysis Complete',
        description: `Quality: ${data.insights.quality} (${Math.round(data.insights.confidence * 100)}% confidence)`,
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze image',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    isAnalyzing,
    analysis,
    analyzeImage,
  };
} 