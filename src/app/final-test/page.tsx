"use client";

import React from 'react';
import { Button } from '@/components/ui-migrated/button';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui-migrated/card';
import { useToast } from '@/components/ui-migrated/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui-migrated/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui-migrated/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui-migrated/dialog';
import { Input } from '@/components/ui-migrated/input';
import { Label } from '@/components/ui-migrated/label';
import { ScrollArea } from '@/components/ui-migrated/scroll-area';
import { Toaster } from '@/components/ui-migrated/toaster'; 
import { ErrorBoundary } from '@/components/error-boundary';

export default function FinalTestPage() {
  const { toast } = useToast();

  const showToast = () => {
    toast({
      title: "Component Test",
      description: "The toast component is working correctly.",
    });
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-10">Final Migration Test</h1>
        
        <Tabs defaultValue="basic" className="w-full mb-8">
          <TabsList>
            <TabsTrigger value="basic">Basic Components</TabsTrigger>
            <TabsTrigger value="complex">Complex Components</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="p-4 border rounded-md">
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
          </TabsContent>
          
          <TabsContent value="complex" className="p-4 border rounded-md">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4">Dialog</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open Dialog</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Dialog Test</DialogTitle>
                      <DialogDescription>
                        This is a dialog from the migrated UI components.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input id="name" placeholder="Enter your name" />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div>
                <h2 className="text-xl font-bold mb-4">Alert Dialog</h2>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Show Alert Dialog</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your
                        account and remove your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              
              <div>
                <h2 className="text-xl font-bold mb-4">ScrollArea</h2>
                <ScrollArea className="h-48 w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} className="p-2 border-b last:border-0">
                        Item {i + 1}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </ErrorBoundary>
  );
} 