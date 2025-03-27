import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">About CardProfit Pro</h1>
        
        <section className="prose lg:prose-lg">
          <p className="text-lg mb-6">
            CardProfit Pro is the leading platform for sports card collectors and investors, 
            providing cutting-edge tools and analytics to maximize your collection's value.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p className="mb-6">
            Our mission is to empower collectors and investors with the tools and insights 
            they need to make informed decisions in the sports card market. We combine 
            advanced analytics with user-friendly interfaces to help you track, manage, 
            and optimize your card investments.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Why Choose CardProfit Pro?</h2>
          <ul className="list-disc pl-6 mb-6">
            <li className="mb-2">
              <strong>Comprehensive Analytics:</strong> Get detailed insights into market trends, 
              price movements, and investment opportunities.
            </li>
            <li className="mb-2">
              <strong>Portfolio Management:</strong> Track your entire collection in one place 
              with our advanced portfolio tools.
            </li>
            <li className="mb-2">
              <strong>Market Intelligence:</strong> Stay ahead of the market with our real-time 
              data and predictive analytics.
            </li>
            <li className="mb-2">
              <strong>Expert Support:</strong> Our team of industry experts is here to help 
              you succeed in your collecting journey.
            </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Team</h2>
          <p className="mb-6">
            CardProfit Pro was founded by a team of passionate collectors and technology 
            experts who understand the unique challenges of the sports card market. We're 
            committed to continuous innovation and providing the best possible experience 
            for our users.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
} 