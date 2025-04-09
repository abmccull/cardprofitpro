"use client";

import React from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui-migrated/card';
import { useToast } from '@/components/ui-migrated/use-toast';

export default function TestFixedPage() {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "Component Test",
      description: "The toast component is working correctly.",
    });
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-10">Migrated Components Test</h1>
      
      <div className="flex flex-wrap gap-4 mb-8">
        <Button variant="default" onClick={showToast}>Show Toast</Button>
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
          <p className="mt-2">If you can see this card, the migration is working correctly.</p>
        </CardContent>
        <CardFooter>
          <Button onClick={showToast}>Show Toast</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 