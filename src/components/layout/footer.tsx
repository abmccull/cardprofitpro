import Link from 'next/link';
import { NewsletterForm } from './newsletter-form';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const navigation = {
  social: [
    { name: 'Facebook', href: 'https://facebook.com/cardprofitpro', icon: FaFacebook },
    { name: 'Twitter', href: 'https://twitter.com/cardprofitpro', icon: FaTwitter },
    { name: 'Instagram', href: 'https://instagram.com/cardprofitpro', icon: FaInstagram },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/cardprofitpro', icon: FaLinkedin }
  ],
  main: [
    { name: 'About Us', href: '/about' },
    { name: 'Contact', href: '/contact' },
    { name: 'Blog', href: '/blog' }
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' }
  ]
};

export function Footer() {
  return (
    <footer className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Company Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">CardProfit Pro</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your trusted platform for sports card collection management and investment tracking.
            </p>
            <div className="mt-4 flex space-x-6">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 hover:text-gray-500"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Quick Links</h3>
              <ul role="list" className="mt-4 space-y-4">
                {navigation.main.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Legal</h3>
              <ul role="list" className="mt-4 space-y-4">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} CardProfit Pro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}