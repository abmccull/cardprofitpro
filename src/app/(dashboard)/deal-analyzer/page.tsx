'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function DealAnalyzerPage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file (PNG, JPG, or JPEG)',
        variant: 'destructive',
      });
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast({
        title: 'No image selected',
        description: 'Please select an image to analyze',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const response = await fetch('/api/deal-analysis', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const result = await response.json();
      setAnalysisResult(result.data);

      toast({
        title: 'Analysis Complete',
        description: 'Card analysis has been completed successfully.',
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Deal Analyzer</h2>
        <p className="text-muted-foreground">
          Upload a card image to analyze its condition and calculate potential profits
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 16"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG or JPEG
                  </p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
          <Button
            onClick={handleAnalyze}
            disabled={!selectedImage || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Card'}
          </Button>
        </div>
      </Card>

      {isAnalyzing ? (
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
        </Card>
      ) : analysisResult ? (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium">Predicted Grade</h3>
                <p className="text-2xl font-bold">
                  {analysisResult.predicted_grade.toFixed(1)}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Confidence Score</h3>
                <p className="text-2xl font-bold">
                  {(analysisResult.confidence_score * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <h3 className="font-medium">Estimated Value</h3>
                <p className="text-2xl font-bold">
                  ${analysisResult.estimated_value.toFixed(2)}
                </p>
              </div>
              <div>
                <h3 className="font-medium">Potential ROI</h3>
                <p className="text-2xl font-bold">
                  {analysisResult.roi.toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => router.push('/card-lifecycle')}
                variant="outline"
              >
                Add to Card Lifecycle
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
} 