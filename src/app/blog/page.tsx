import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';

const blogPosts = [
  {
    id: 1,
    title: 'The Rise of Sports Card Investing in 2024',
    excerpt: 'Discover how the sports card market has evolved and why more investors are turning to cards as alternative investments.',
    date: 'March 15, 2024',
    author: 'John Smith',
    category: 'Market Analysis'
  },
  {
    id: 2,
    title: 'Top 10 Baseball Cards to Watch This Season',
    excerpt: 'Our experts break down the most promising baseball cards to keep an eye on as the new season approaches.',
    date: 'March 10, 2024',
    author: 'Sarah Johnson',
    category: 'Investment Tips'
  },
  {
    id: 3,
    title: 'How to Grade Cards Like a Pro',
    excerpt: 'Learn the key factors that professional graders look for and how to evaluate your own cards accurately.',
    date: 'March 5, 2024',
    author: 'Mike Wilson',
    category: 'Guides'
  },
  {
    id: 4,
    title: 'Digital Revolution in Card Collecting',
    excerpt: 'Explore how technology is transforming the way we collect, trade, and invest in sports cards.',
    date: 'March 1, 2024',
    author: 'Emily Chen',
    category: 'Technology'
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-lg text-gray-600">
            Stay up to date with the latest insights, market analysis, and collecting tips.
          </p>
        </div>

        <div className="grid gap-8">
          {blogPosts.map((post) => (
            <article key={post.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-gray-500">{post.date}</span>
                <span className="text-sm px-3 py-1 bg-gray-100 rounded-full">
                  {post.category}
                </span>
              </div>
              
              <h2 className="text-2xl font-semibold mb-3">
                <Link 
                  href={`/blog/${post.id}`} 
                  className="hover:text-blue-600 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-gray-600 mb-4">{post.excerpt}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">By {post.author}</span>
                <Link 
                  href={`/blog/${post.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
} 