import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Exam Question Manager
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Organize, create, and manage your exam questions with full LaTeX support
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <FeatureCard
            title="LaTeX Support"
            description="Write questions and solutions in LaTeX with live preview rendering"
            icon="📐"
          />
          <FeatureCard
            title="Organized"
            description="Categorize by course, topic, difficulty, and custom tags"
            icon="📚"
          />
          <FeatureCard
            title="Export to LaTeX"
            description="Generate complete LaTeX files ready for Overleaf"
            icon="📄"
          />
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <FeatureCard
            title="Track Usage"
            description="Know which questions you've used and when"
            icon="📊"
          />
          <FeatureCard
            title="Secure"
            description="Password protected with encrypted storage"
            icon="🔒"
          />
          <FeatureCard
            title="Backed Up"
            description="Automatic daily backups to keep your data safe"
            icon="💾"
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
