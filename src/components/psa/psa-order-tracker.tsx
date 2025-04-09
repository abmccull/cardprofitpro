'use client';

import { useState } from 'react';
import { usePSAOrderTracking } from '@/hooks/use-psa-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui-migrated/card';
import { Button } from '@/components/ui-migrated/button';
import { Input } from '@/components/ui-migrated/input';
import { Badge } from '@/components/ui-migrated/badge';
import { Skeleton } from '@/components/ui-migrated/skeleton';
import { AlertCircle, Clock, CheckCircle, Package, Truck, ClipboardCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui-migrated/alert';

interface PSAOrderTrackerProps {
  initialOrderNumber?: string;
  className?: string;
}

export function PSAOrderTracker({ initialOrderNumber, className }: PSAOrderTrackerProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  const [isTracking, setIsTracking] = useState(!!initialOrderNumber);
  
  const { 
    data, 
    isLoading,
    error,
    trackNewOrder,
    isTrackingNewOrder
  } = usePSAOrderTracking(isTracking ? orderNumber : null);

  const handleTrackOrder = async () => {
    if (!orderNumber) return;
    
    setIsTracking(true);
    if (!data) {
      await trackNewOrder(orderNumber);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">PSA Order Tracker</CardTitle>
        <CardDescription>Track the status of your PSA grading orders</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Enter PSA Order Number"
            disabled={isLoading || isTrackingNewOrder}
          />
          <Button 
            onClick={handleTrackOrder}
            disabled={!orderNumber || isLoading || isTrackingNewOrder}
            className="whitespace-nowrap"
          >
            {isTrackingNewOrder ? 'Tracking...' : 'Track Order'}
          </Button>
        </div>

        {(isLoading || isTrackingNewOrder) && <PSAOrderTrackerSkeleton />}

        {error && !isLoading && !isTrackingNewOrder && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {data && !isLoading && !isTrackingNewOrder && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium">Order #{data.order_number}</h3>
                <p className="text-xs text-muted-foreground">
                  {data.cards_count} {data.cards_count === 1 ? 'card' : 'cards'}
                </p>
              </div>
              <OrderStatusBadge status={data.status} />
            </div>

            <div className="relative">
              <div className="absolute top-0 left-5 h-full w-0.5 bg-muted"></div>
              
              <OrderStep 
                title="Order Created"
                date={data.created_at ? new Date(data.created_at).toLocaleDateString() : undefined}
                status="completed"
                icon={<ClipboardCheck className="h-4 w-4" />}
              />
              
              <OrderStep 
                title="Order Received"
                date={data.received_at ? new Date(data.received_at).toLocaleDateString() : undefined}
                status={getStepStatus(data.status, 'Order Received')}
                icon={<Package className="h-4 w-4" />}
              />
              
              <OrderStep 
                title="Order Processing"
                date={data.processing_at ? new Date(data.processing_at).toLocaleDateString() : undefined}
                status={getStepStatus(data.status, 'Processing')}
                icon={<Clock className="h-4 w-4" />}
              />
              
              <OrderStep 
                title="Order Shipped"
                date={data.shipped_at ? new Date(data.shipped_at).toLocaleDateString() : undefined}
                status={getStepStatus(data.status, 'Shipped')}
                icon={<Truck className="h-4 w-4" />}
              />
              
              <OrderStep 
                title="Order Completed"
                date={data.completed_at ? new Date(data.completed_at).toLocaleDateString() : undefined}
                status={getStepStatus(data.status, 'Completed')}
                icon={<CheckCircle className="h-4 w-4" />}
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {data ? `Last updated: ${new Date(data.updated_at).toLocaleDateString()}` : 
          'Enter your order number to start tracking'}
      </CardFooter>
    </Card>
  );
}

type OrderStepStatus = 'upcoming' | 'current' | 'completed';

function OrderStep({ 
  title, 
  date, 
  status,
  icon
}: { 
  title: string; 
  date?: string;
  status: OrderStepStatus;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative pl-10 pb-8 last:pb-0">
      <div className={`
        absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border
        ${status === 'completed' ? 'bg-primary text-primary-foreground' : 
          status === 'current' ? 'border-primary bg-primary/20' : 'bg-muted'}
      `}>
        {icon}
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        {date && <p className="text-xs text-muted-foreground">{date}</p>}
        {status === 'current' && !date && (
          <p className="text-xs text-primary font-medium">In Progress</p>
        )}
      </div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'Order Received':
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Received</Badge>;
    case 'Processing':
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Processing</Badge>;
    case 'Shipped':
      return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Shipped</Badge>;
    case 'Completed':
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getStepStatus(currentStatus: string, stepStatus: string): OrderStepStatus {
  const statusOrder = ['Order Received', 'Processing', 'Shipped', 'Completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const stepIndex = statusOrder.indexOf(stepStatus);
  
  if (currentIndex === -1 || stepIndex === -1) return 'upcoming';
  
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

export function PSAOrderTrackerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16 mt-1" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex">
            <Skeleton className="h-10 w-10 rounded-full mr-4" />
            <div>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 