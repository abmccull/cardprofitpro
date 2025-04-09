"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui-migrated/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui-migrated/dialog';
import { Button } from '@/components/ui-migrated/button';

export default function ComplexComponentTestPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-10">Complex Component Test</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tabs Component</h2>
        <Tabs defaultValue="account" className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account" className="p-4 border rounded-md mt-2">
            <p>Account tab content goes here</p>
          </TabsContent>
          <TabsContent value="password" className="p-4 border rounded-md mt-2">
            <p>Password tab content goes here</p>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Dialog Component</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dialog Example</DialogTitle>
              <DialogDescription>
                This is a dialog component from the migrated UI components.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>Dialog content goes here.</p>
            </div>
            <DialogFooter>
              <Button>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 