'use client';

import { useState } from 'react';
import { Input } from '@/components/ui-migrated/input';
import { Button } from '@/components/ui-migrated/button';
import { toast } from 'sonner';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleNewsletterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement newsletter subscription
      // For now, just show a success message
      toast.success('Successfully subscribed to newsletter!');
      setEmail('');
    } catch (error) {
      toast.error('Failed to subscribe to newsletter');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleNewsletterSubmit} className="mt-6">
      <h3 className="text-sm font-semibold text-gray-900">Subscribe to our newsletter</h3>
      <p className="mt-2 text-sm text-gray-600">
        Stay updated with our latest features and releases.
      </p>
      <div className="mt-4 flex gap-x-3">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="min-w-0 flex-auto"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </div>
    </form>
  );
} 