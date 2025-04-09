"use client";

import React from 'react';
import TestMigratedComponents from '@/components/test-component-imports';

export default function ComponentTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-10">Component Migration Test Page</h1>
      <p className="mb-8 text-muted-foreground">
        This page tests the rendering of all migrated UI components to ensure they work correctly in a Next.js app context.
      </p>
      
      <div className="border rounded-lg p-6 bg-card">
        <TestMigratedComponents />
      </div>
    </div>
  );
} 