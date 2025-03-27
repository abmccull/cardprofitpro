import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose lg:prose-lg">
          <p className="text-lg mb-8">Last updated: March 15, 2024</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p>
              CardProfit Pro respects your privacy and is committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <ul className="list-disc pl-6">
              <li>Personal identification information</li>
              <li>Card collection data</li>
              <li>Usage data</li>
              <li>Payment information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <ul className="list-disc pl-6">
              <li>To provide our services</li>
              <li>To improve our platform</li>
              <li>To communicate with you</li>
              <li>To process payments</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p>
              Questions about our privacy policy? Contact us at{' '}
              <a href="mailto:privacy@cardprofitpro.com" className="text-blue-600 hover:text-blue-800">
                privacy@cardprofitpro.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
} 