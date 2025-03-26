import { auth, currentUser } from "@clerk/nextjs/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import type { ActivityItem } from "@/components/dashboard/recent-activity";
import { createClient } from "@/lib/supabase/client";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();
  
  // Initialize Supabase client
  const supabase = createClient();

  // Get counts of cards, PSA submissions, total profit
  const { count: cardsCount } = await supabase
    .from('cards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: psaOrdersCount } = await supabase
    .from('psa_grading_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('status', 'eq', 'Completed');

  // Get sales data for profit calculation
  const { data: soldCards } = await supabase
    .from('cards')
    .select('purchase_price, sale_price')
    .eq('user_id', userId)
    .eq('is_sold', true);

  // Calculate total profit and ROI
  let totalProfit = 0;
  let totalInvestment = 0;
  let roi = 0;

  if (soldCards && soldCards.length > 0) {
    totalProfit = soldCards.reduce((sum, card) => {
      const profit = (card.sale_price || 0) - (card.purchase_price || 0);
      return sum + profit;
    }, 0);
    
    totalInvestment = soldCards.reduce((sum, card) => sum + (card.purchase_price || 0), 0);
    
    roi = totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;
  }

  // Get recent activity
  const { data: recentCardActivity } = await supabase
    .from('cards')
    .select('id, name, created_at, purchase_price, sale_price, is_sold')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(3);

  // Transform card activity into ActivityItem format
  const activityItems: ActivityItem[] = (recentCardActivity || []).map(card => ({
    id: card.id,
    title: card.name,
    timestamp: card.created_at,
    type: card.is_sold ? 'card_sold' : 'card_added',
    description: card.is_sold 
      ? `Sold for $${(card.sale_price || 0).toFixed(2)}`
      : `Purchased for $${(card.purchase_price || 0).toFixed(2)}`,
    linkHref: `/my-cards/${card.id}`,
    linkText: 'View Card'
  }));

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome to your CardProfit Pro dashboard{user?.firstName ? `, ${user.firstName}` : ''}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Active Cards" 
            value={cardsCount || 0} 
            iconName="CreditCard"
            href="/my-cards"
            accentColor="blue"
            description="Total cards in your collection"
          />
          
          <StatCard 
            title="Pending PSA Submissions" 
            value={psaOrdersCount || 0} 
            iconName="Award"
            href="/psa"
            accentColor="orange"
            description="Orders being processed by PSA"
          />
          
          <StatCard 
            title="Total Profit" 
            value={`$${totalProfit.toFixed(2)}`} 
            iconName="DollarSign"
            href="/analytics"
            accentColor={totalProfit >= 0 ? "green" : "red"}
            description={`From ${soldCards?.length || 0} sold cards`}
          />
          
          <StatCard 
            title="Average ROI" 
            value={`${roi.toFixed(1)}%`} 
            iconName="TrendingUp"
            href="/analytics"
            accentColor={roi >= 0 ? "green" : "red"}
            description="Return on investment"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6">
          <RecentActivity activities={activityItems} />
        </div>
      </div>
    </div>
  );
} 