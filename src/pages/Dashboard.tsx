import { Rocket, Globe, Zap, TrendingUp, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useProject } from '../contexts/ProjectContext';

export function Dashboard() {
  const { projects, posts, selectProject } = useProject();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary-light mb-6">
          <Zap className="w-4 h-4" />
          AI-Powered Growth Marketing
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Grow your app on{' '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            autopilot
          </span>
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto">
          Enter your website URL. Get viral content for every platform.
          Twitter, LinkedIn, Reddit, Instagram, TikTok, YouTube — all in one click.
        </p>
      </div>

      {/* Stats */}
      {projects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Projects', value: projects.length, icon: Globe, color: 'text-primary-light' },
            { label: 'Posts Generated', value: posts.length, icon: Zap, color: 'text-accent' },
            { label: 'Platforms', value: 7, icon: TrendingUp, color: 'text-success' },
            { label: 'Ready to Publish', value: posts.filter((p) => p.status === 'draft').length, icon: Rocket, color: 'text-warning' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Projects list or CTA */}
      {projects.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Rocket className="w-8 h-8 text-primary-light" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No projects yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Add your first website to start generating marketing content for all platforms automatically.
          </p>
          <Link to="/generate">
            <Button size="lg">
              <Plus className="w-5 h-5" /> Add Your First Project
            </Button>
          </Link>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Projects</h2>
            <Link to="/generate">
              <Button size="sm">
                <Plus className="w-4 h-4" /> New Project
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link key={project.id} to="/generate" onClick={() => selectProject(project.id)}>
                <Card hover>
                  <div className="flex items-start gap-3">
                    {project.scraped_data?.logo ? (
                      <img
                        src={project.scraped_data.logo}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-surface-lighter"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary-light" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">{project.url}</p>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="py-8">
        <h2 className="text-xl font-bold text-white text-center mb-8">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '1',
              title: 'Paste your URL',
              desc: 'We scrape your website — title, description, features, images, keywords.',
              color: 'from-primary to-primary-dark',
            },
            {
              step: '2',
              title: 'AI generates content',
              desc: 'Tailored posts for each platform — Twitter threads, LinkedIn stories, Reddit posts, and more.',
              color: 'from-accent to-accent-dark',
            },
            {
              step: '3',
              title: 'Publish everywhere',
              desc: 'Copy-paste or auto-publish. Videos generated with Remotion for TikTok & YouTube.',
              color: 'from-success to-emerald-700',
            },
          ].map(({ step, title, desc, color }) => (
            <Card key={step} className="text-center">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-4`}
              >
                <span className="text-xl font-bold text-white">{step}</span>
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-400">{desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
