"use client";

import React from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui-migrated/alert';

export default function SimpleComponentTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-10">Simple Component Test Page</h1>
      <p className="mb-8">This page tests a minimal set of migrated UI components.</p>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Button</h2>
          <div className="flex gap-4">
            <Button>Default Button</Button>
            <Button variant="outline">Outline Button</Button>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Alert</h2>
          <Alert>
            <AlertTitle>Alert Title</AlertTitle>
            <AlertDescription>
              This is an example alert description.
            </AlertDescription>
          </Alert>
        </section>
      </div>
    </div>
  );
} 