"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
// This file is specifically for testing component imports, so unused vars are expected
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from './ui-migrated/avatar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink } from './ui-migrated/breadcrumb';
import { Command, CommandInput, CommandList } from './ui-migrated/command';
import { ScrollArea } from './ui-migrated/scroll-area';
import { Carousel, CarouselContent, CarouselItem } from './ui-migrated/carousel';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui-migrated/accordion';
import { ChartContainer } from './ui-migrated/chart';
import { 
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle, 
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from './ui-migrated/alert-dialog';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent
} from './ui-migrated/navigation-menu';
import { Separator } from './ui-migrated/separator';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui-migrated/dialog';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from './ui-migrated/button';
import { Badge, badgeVariants } from './ui-migrated/badge';
import { Alert, AlertTitle, AlertDescription } from './ui-migrated/alert';
import { AspectRatio } from './ui-migrated/aspect-ratio';
import { Calendar } from './ui-migrated/calendar';
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './ui-migrated/card';
import { Checkbox } from './ui-migrated/checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup,  } from './ui-migrated/dropdown-menu';
import { useFormField, Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField,  } from './ui-migrated/form';
import { HoverCard, HoverCardTrigger, HoverCardContent } from './ui-migrated/hover-card';
import { Input } from './ui-migrated/input';
import { Label } from './ui-migrated/label';
import { Popover, PopoverTrigger, PopoverContent } from './ui-migrated/popover';
import { Progress } from './ui-migrated/progress';
import { RadioGroup, RadioGroupItem } from './ui-migrated/radio-group';
import { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton,  } from './ui-migrated/select';
import { Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription,  } from './ui-migrated/sheet';
import { Skeleton } from './ui-migrated/skeleton';
import { Slider } from './ui-migrated/slider';
import { Switch } from './ui-migrated/switch';
import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption,  } from './ui-migrated/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui-migrated/tabs';
import { Textarea } from './ui-migrated/textarea';
import { type ToastProps, type ToastActionElement, ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction,  } from './ui-migrated/toast';
import { ToggleGroup, ToggleGroupItem } from './ui-migrated/toggle-group';
import { Toggle, toggleVariants } from './ui-migrated/toggle';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './ui-migrated/tooltip';

// This component is just for testing imports - it will never be rendered
export default function TestMigratedComponents() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Test Migrated Components</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Avatar</h2>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Breadcrumb</h2>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="/components">Components</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Command</h2>
          <Command>
            <CommandInput placeholder="Type a command..." />
            <CommandList>
              {/* Command items would go here */}
            </CommandList>
          </Command>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">ScrollArea</h2>
          <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
            <div>
              {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} className="text-sm">
                  Item {i + 1}
                </div>
              ))}
            </div>
          </ScrollArea>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Carousel</h2>
          <Carousel className="w-full max-w-xs">
            <CarouselContent>
              {Array.from({ length: 5 }).map((_, i) => (
                <CarouselItem key={i}>
                  <div className="p-1">
                    <div className="flex aspect-square items-center justify-center rounded-md bg-muted p-6">
                      Slide {i + 1}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Accordion</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Section 1</AccordionTrigger>
              <AccordionContent>
                Content for section 1
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Section 2</AccordionTrigger>
              <AccordionContent>
                Content for section 2
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Chart</h2>
          <ChartContainer
            className="aspect-square w-full max-w-3xl"
            config={{
              example: {
                label: "Example",
                color: "#0ea5e9"
              }
            }}
          >
            <div>Chart content placeholder</div>
          </ChartContainer>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Alert Dialog</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Open Alert</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alert Title</AlertDialogTitle>
                <AlertDialogDescription>
                  This is a description of the alert dialog
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Navigation Menu</h2>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Item One</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-4">
                    <p>Navigation Content</p>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="#">Link Item</NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Separator</h2>
          <div className="space-y-4">
            <p>Content above</p>
            <Separator />
            <p>Content below</p>
            
            <div className="flex items-center gap-4">
              <div>Left</div>
              <Separator orientation="vertical" className="h-8" />
              <div>Right</div>
            </div>
          </div>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">Dialog</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog Title</DialogTitle>
                <DialogDescription>
                  This is a description of the dialog
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button>Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      </div>
    </div>
  );
} 