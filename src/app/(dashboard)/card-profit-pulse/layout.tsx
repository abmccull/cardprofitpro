import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Card Profit Pulse | Card Profit Pro',
  description: 'Analyze card profit opportunities based on eBay data',
};

export default function CardProfitPulseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {children}
    </div>
  );
} 