"use client";

import React from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui-migrated/card';

export default function ButtonTestPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-10">Button Component Test</h1>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <Button variant="default">Default Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="outline">Outline Button</Button>
        <Button variant="destructive">Destructive Button</Button>
      </div>
      
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description Goes Here</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is a simple card content to test the Card component.</p>
        </CardContent>
        <CardFooter>
          <Button>Action Button</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 