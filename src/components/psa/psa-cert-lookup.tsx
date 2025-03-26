'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PSACardInfo } from './psa-card-info';

interface PSACertLookupProps {
  className?: string;
}

export function PSACertLookup({ className }: PSACertLookupProps) {
  const [certNumber, setCertNumber] = useState('');
  const [lookupCert, setLookupCert] = useState('');
  const [includePopulation, setIncludePopulation] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (certNumber.trim()) {
      setLookupCert(certNumber.trim());
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">PSA Certification Lookup</CardTitle>
          <CardDescription>Check the authenticity and details of PSA graded cards</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="cert-number">PSA Certification Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="cert-number"
                  placeholder="Enter PSA cert number (e.g. 12345678)"
                  value={certNumber}
                  onChange={(e) => setCertNumber(e.target.value)}
                />
                <Button type="submit" className="whitespace-nowrap">
                  Lookup
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="include-population"
                checked={includePopulation}
                onCheckedChange={setIncludePopulation}
              />
              <Label htmlFor="include-population">Include population data</Label>
            </div>
          </form>
        </CardContent>
      </Card>

      {lookupCert && (
        <div className="mt-4">
          <PSACardInfo certNumber={lookupCert} />
        </div>
      )}
    </div>
  );
} 