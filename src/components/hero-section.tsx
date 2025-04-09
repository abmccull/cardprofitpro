'use client';

import { Button } from "@/components/ui-migrated/button";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="flex h-screen items-center justify-center bg-gradient-to-b from-background to-muted px-4">
      <div className="container flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Maximize Your Sports Card Profits
        </h1>
        <p className="mt-4 max-w-[700px] text-lg text-muted-foreground sm:text-xl">
          Discover, analyze, and track sports card investments with powerful tools
          and real-time market data.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/auth/sign-up">
            <Button size="lg">Start Free Trial</Button>
          </Link>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Learn More
          </Button>
        </div>
      </div>
    </section>
  );
} 