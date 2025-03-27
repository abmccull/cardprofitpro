import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        
        <div className="prose lg:prose-lg">
          <p className="text-lg mb-8">Last updated: March 15, 2024</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing or using CardProfit Pro, you agree to be bound by these Terms of Service. 
              If you disagree with any part of these terms, you may not access our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="mb-4">
              We grant you a limited, non-exclusive, non-transferable license to use our platform 
              for your personal or business card collection management needs.
            </p>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6">
              <li>Modify or copy our platform's materials</li>
              <li>Use the platform for any commercial purpose without authorization</li>
              <li>Attempt to decompile or reverse engineer the software</li>
              <li>Remove any copyright or proprietary notations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Terms</h2>
            <ul className="list-disc pl-6">
              <li>You must be 18 years or older to use this service</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must notify us of any security breaches</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Payment Terms</h2>
            <p>
              Subscription fees are billed in advance. All fees are non-refundable unless 
              otherwise stated. We reserve the right to change our pricing with 30 days notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Contact</h2>
            <p>
              Questions about our terms? Contact us at{' '}
              <a href="mailto:legal@cardprofitpro.com" className="text-blue-600 hover:text-blue-800">
                legal@cardprofitpro.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
} 