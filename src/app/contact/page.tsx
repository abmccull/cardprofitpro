import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ContactForm } from '@/components/contact/contact-form';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-lg text-gray-600 mb-8">
              Have questions? We'd love to hear from you. Send us a message
              and we'll respond as soon as possible.
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">Email</h3>
                <p className="text-gray-600">support@cardprofitpro.com</p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Office Hours</h3>
                <p className="text-gray-600">Monday - Friday: 9am - 5pm EST</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Location</h3>
                <p className="text-gray-600">
                  123 Trading Card Lane<br />
                  Suite 456<br />
                  New York, NY 10001
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 