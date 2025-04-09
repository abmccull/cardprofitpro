'use client';

import { usePSAData, PSACardData } from '@/hooks/use-psa-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui-migrated/card';
import { Badge } from '@/components/ui-migrated/badge';
import { Skeleton } from '@/components/ui-migrated/skeleton';
import { AlertCircle, CheckCircle, Award } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui-migrated/alert';

interface PSACardInfoProps {
  certNumber: string;
  className?: string;
}

export function PSACardInfo({ certNumber, className }: PSACardInfoProps) {
  const { data, isLoading, error } = usePSAData(certNumber);

  if (isLoading) {
    return <PSACardInfoSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No PSA Data</AlertTitle>
        <AlertDescription>No certification information found for {certNumber}.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          PSA Certification
          <Badge variant="outline" className="ml-auto">
            {data.grade}
          </Badge>
        </CardTitle>
        <CardDescription>Cert #{data.cert_number}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="font-medium">Card Details</div>
          <div className="text-right font-medium">Population</div>

          <div className="text-muted-foreground">
            {[data.year, data.brand, data.series, data.card_number]
              .filter(Boolean)
              .join(' · ')}
          </div>
          <div className="text-right">
            <RarityBadge 
              grade={data.grade} 
              psa10Count={data.psa10_count} 
              totalPopulation={data.total_population} 
            />
          </div>

          <div className="col-span-2 mt-1">
            <p className="text-sm">{data.description}</p>
          </div>
          
          <div className="col-span-2 mt-2 grid grid-cols-3 gap-x-2 gap-y-1">
            <PSACountItem label="PSA 10" count={data.psa10_count} />
            <PSACountItem label="PSA 9" count={data.psa9_count} />
            <PSACountItem label="Total Graded" count={data.total_population} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 text-xs text-muted-foreground">
        Last updated: {new Date(data.updated_at).toLocaleDateString()}
      </CardFooter>
    </Card>
  );
}

function RarityBadge({ 
  grade, 
  psa10Count, 
  totalPopulation 
}: { 
  grade: string; 
  psa10Count: number; 
  totalPopulation: number | null;
}) {
  if (grade === '10' && psa10Count < 10) {
    return (
      <Badge className="bg-amber-500">
        <Award className="h-3 w-3 mr-1" />
        Ultra Rare
      </Badge>
    );
  }
  
  if (grade === '10' && psa10Count < 50) {
    return (
      <Badge className="bg-indigo-500">
        <Award className="h-3 w-3 mr-1" />
        Very Rare
      </Badge>
    );
  }
  
  if (grade === '10' && psa10Count < 100) {
    return (
      <Badge>
        <Award className="h-3 w-3 mr-1" />
        Rare
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline">
      {psa10Count} PSA 10s
    </Badge>
  );
}

function PSACountItem({ label, count }: { label: string; count: number | null }) {
  return (
    <div className="text-center bg-muted/50 rounded-md py-1 px-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{count ?? '—'}</div>
    </div>
  );
}

export function PSACardInfoSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Skeleton className="h-5 w-5 mr-2" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-12 ml-auto" />
        </div>
        <Skeleton className="h-4 w-20 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          
          <Skeleton className="h-4 w-full" />
          
          <div className="grid grid-cols-3 gap-2 mt-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Skeleton className="h-3 w-32" />
      </CardFooter>
    </Card>
  );
} 