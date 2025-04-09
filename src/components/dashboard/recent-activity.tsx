'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui-migrated/card';
import { buttonVariants } from '@/components/ui-migrated/button';
import { cn } from '@/lib/utils';
import { Activity, Clock } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'card_added' | 'card_sold' | 'psa_update' | 'snipe_placed' | 'bid_won';
  title: string;
  description: string;
  timestamp: string;
  linkHref?: string;
  linkText?: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  className?: string;
}

export function RecentActivity({ activities = [], className }: RecentActivityProps) {
  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-md font-medium">Recent Activity</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No recent activity yet</p>
            <p className="text-xs text-muted-foreground">
              Activities will appear here once you start using CardProfit Pro
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
                {activity.linkHref && activity.linkText && (
                  <Link
                    href={activity.linkHref}
                    className={cn(
                      buttonVariants({ variant: 'outline', size: 'sm' }),
                      'whitespace-nowrap'
                    )}
                  >
                    {activity.linkText}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link
          href="/activity"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'w-full justify-center'
          )}
        >
          View All Activity
        </Link>
      </CardFooter>
    </Card>
  );
} 