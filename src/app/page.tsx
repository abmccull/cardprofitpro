import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-50 to-blue-100 py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                  Multiply Your Sports Card Profits by 2.5x–3x—Get Started Today!
                </h1>
                <p className="text-xl text-gray-700">
                  Say goodbye to guesswork and missed opportunities. With CardProfit Pro, you can source undervalued cards, predict PSA 10 outcomes, and sell for maximum return—all in one seamless platform.
                </p>
                <div>
                  <Link 
                    href="/auth/sign-up" 
                    className="inline-block px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-lg shadow-lg transform transition hover:scale-105"
                  >
                    Sign Up Now
                  </Link>
                </div>
              </div>
              <div className="relative h-96 lg:h-[500px] w-full max-w-[285px] overflow-hidden rounded-lg shadow-xl bg-white">
                <Image
                  src="/hero-image.jpg" 
                  alt="CardProfit Pro Dashboard"
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 100vw, 285px"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
              Your Toolkit for Profitable Card Flipping
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:translate-y-[-5px]">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Discover Hidden Deals</h3>
                <p className="text-gray-600 text-center">
                  Find undervalued sports cards fast with real-time data from eBay, social platforms, and online auctions. Stop missing out on profit opportunities.
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:translate-y-[-5px]">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Maximize Every Trade</h3>
                <p className="text-gray-600 text-center">
                  Our AI-powered deal analyzer predicts PSA 10 potential and calculates your profit on the spot—so you never overpay or undersell.
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-8 transition-transform hover:translate-y-[-5px]">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-3">Streamline Your Workflow</h3>
                <p className="text-gray-600 text-center">
                  Manage your cards from discovery to final sale in one intuitive dashboard. Track grading submissions and final auction results without the hassle.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              How CardProfit Pro Works
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Spot the Opportunity</h3>
                <p className="text-gray-600">
                  Instantly uncover undervalued cards using real-time market insights.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Crunch the Numbers</h3>
                <p className="text-gray-600">
                  Let AI predict PSA 10 outcomes and profit potential before you buy.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-4">Sell with Confidence</h3>
                <p className="text-gray-600">
                  Track your cards and choose the perfect moment to list for maximum return.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              Real Results from Real Users
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full overflow-hidden mr-4">
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Jake Miller</h3>
                    <p className="text-sm text-gray-600">Card Flipping Enthusiast</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "CardProfit Pro turned a $75 raw card into a PSA 10 that sold for $225. It's a game-changer!"
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full overflow-hidden mr-4">
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Emily Torres</h3>
                    <p className="text-sm text-gray-600">Part-Time Trader</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">
                  "I used to miss great deals all the time. Now, I've flipped cards for over $1,200 in profit this month alone!"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
              Pick the Plan That Fits Your Goals
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Solo Trader Plan */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-8 border-b border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Solo Trader</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">$50</span>
                    <span className="text-gray-600 ml-1">/month</span>
                  </div>
                  <p className="mt-4 text-gray-600">Perfect for solo flippers looking to boost profits with powerful tools.</p>
                </div>
                <div className="p-8">
                  <ul className="space-y-4">
                    {[
                      'Unlimited Card Searches',
                      'AI Grade Predictions',
                      'Real-Time Market Insights',
                      'PSA Tracking & Submissions',
                      'Mobile-Friendly Dashboard',
                      'Profit Analytics'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/sign-up"
                    className="mt-8 block w-full text-center px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </div>

              {/* Pro Trader Plan */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border-4 border-blue-500">
                <div className="p-8 border-b border-gray-200 bg-blue-50">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Trader</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-gray-900">$99</span>
                    <span className="text-gray-600 ml-1">/month</span>
                  </div>
                  <p className="mt-4 text-gray-600">For serious traders who want to scale their profits.</p>
                </div>
                <div className="p-8">
                  <ul className="space-y-4">
                    {[
                      'Everything in Solo Trader',
                      'Advanced Market Analytics',
                      'Priority PSA Submissions',
                      'Bulk Card Management',
                      'ROI Forecasting',
                      'Premium Support'
                    ].map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/sign-up"
                    className="mt-8 block w-full text-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
} 