import { Metadata } from 'next';
import { PSACertLookup } from '@/components/psa/psa-cert-lookup';
import { PSAOrderTracker } from '@/components/psa/psa-order-tracker';

export const metadata: Metadata = {
  title: 'PSA Tools | CardProfit Pro',
  description: 'Lookup PSA certification details and track your PSA grading orders',
};

export default function PSAToolsPage() {
  return (
    <div className="container max-w-5xl py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">PSA Tools</h1>
        <p className="text-muted-foreground">
          Verify PSA certifications and track your orders with real-time updates
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <PSACertLookup />
        </div>
        <div>
          <PSAOrderTracker />
        </div>
      </div>
      
      <div className="rounded-lg border p-4 bg-card text-card-foreground shadow-sm">
        <h2 className="text-xl font-semibold mb-2">About PSA Tools</h2>
        <p className="text-sm mb-3">
          Our PSA integration provides you with valuable insights into your graded cards:
        </p>
        <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
          <li>Verify the authenticity of any PSA graded card</li>
          <li>Check population reports to understand rarity</li>
          <li>Track your PSA submissions through every stage of the grading process</li>
          <li>Get notified when your orders change status</li>
          <li>Automatically import your graded cards to your collection when orders complete</li>
        </ul>
      </div>
    </div>
  );
} 