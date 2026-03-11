import { useState, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Layout, Plus, Trash2, Eye, Download, Save, GripVertical,
  Sparkles, Type, Star, DollarSign, HelpCircle, MousePointer,
} from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import type { LandingSection, LandingPage } from '../services/landingService';
import { saveLandingPage, generateLandingHTML } from '../services/landingService';

const SECTION_TYPES: { type: LandingSection['type']; label: string; icon: typeof Layout; desc: string }[] = [
  { type: 'hero', label: 'Hero', icon: Sparkles, desc: 'Main headline + CTA' },
  { type: 'features', label: 'Features', icon: Layout, desc: 'Feature grid' },
  { type: 'testimonial', label: 'Testimonials', icon: Star, desc: 'Social proof' },
  { type: 'cta', label: 'CTA', icon: MousePointer, desc: 'Call to action' },
  { type: 'pricing', label: 'Pricing', icon: DollarSign, desc: 'Pricing plans' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, desc: 'Questions & answers' },
];

function defaultSection(type: LandingSection['type']): LandingSection {
  const id = crypto.randomUUID();
  switch (type) {
    case 'hero':
      return { id, type, title: 'Your Product Name', subtitle: 'A compelling tagline that explains your value proposition', buttonText: 'Get Started', buttonUrl: '#' };
    case 'features':
      return { id, type, title: 'Features', items: [
        { title: 'Fast', description: 'Lightning fast performance', icon: '⚡' },
        { title: 'Secure', description: 'Enterprise-grade security', icon: '🔒' },
        { title: 'Simple', description: 'Easy to use interface', icon: '✨' },
      ]};
    case 'testimonial':
      return { id, type, title: 'What People Say', items: [
        { title: 'John Doe, CEO', description: 'This product changed our workflow completely.' },
      ]};
    case 'cta':
      return { id, type, title: 'Ready to Get Started?', subtitle: 'Join thousands of happy users.', buttonText: 'Start Free Trial', buttonUrl: '#' };
    case 'pricing':
      return { id, type, title: 'Pricing', items: [
        { title: 'Free', description: '$0/mo — Basic features' },
        { title: 'Pro', description: '$29/mo — Everything included' },
      ]};
    case 'faq':
      return { id, type, title: 'Frequently Asked Questions', items: [
        { title: 'How does it work?', description: 'Simply sign up and start using our platform.' },
      ]};
  }
}

export default function LandingBuilder() {
  const { currentProject } = useProject();
  const [title, setTitle] = useState(currentProject?.name ? `${currentProject.name} — Landing Page` : 'My Landing Page');
  const [sections, setSections] = useState<LandingSection[]>([
    defaultSection('hero'),
    defaultSection('features'),
    defaultSection('cta'),
  ]);
  const [pageId] = useState(() => crypto.randomUUID());
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addSection = (type: LandingSection['type']) => {
    setSections((prev) => [...prev, defaultSection(type)]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const moveSection = (id: string, direction: -1 | 1) => {
    setSections((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  const updateSection = (id: string, updates: Partial<LandingSection>) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
  };

  const updateSectionItem = (sectionId: string, itemIdx: number, field: 'title' | 'description' | 'icon', value: string) => {
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId || !s.items) return s;
      const items = [...s.items];
      items[itemIdx] = { ...items[itemIdx], [field]: value };
      return { ...s, items };
    }));
  };

  const addSectionItem = (sectionId: string) => {
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId) return s;
      return { ...s, items: [...(s.items || []), { title: 'New Item', description: 'Description here' }] };
    }));
  };

  const removeSectionItem = (sectionId: string, itemIdx: number) => {
    setSections((prev) => prev.map((s) => {
      if (s.id !== sectionId || !s.items) return s;
      return { ...s, items: s.items.filter((_, i) => i !== itemIdx) };
    }));
  };

  const handlePreview = useCallback(() => {
    const page: LandingPage = {
      id: pageId,
      project_id: currentProject?.id || '',
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sections,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPreviewHtml(generateLandingHTML(page));
  }, [title, sections, currentProject]);

  const handleExport = useCallback(() => {
    const page: LandingPage = {
      id: pageId,
      project_id: currentProject?.id || '',
      title,
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sections,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const html = generateLandingHTML(page);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.slug}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [title, sections, currentProject]);

  const handleSave = useCallback(async () => {
    if (!currentProject) return;
    setSaving(true);
    try {
      const page: LandingPage = {
        id: crypto.randomUUID(),
        project_id: currentProject.id,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        sections,
        published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await saveLandingPage(page);
    } finally {
      setSaving(false);
    }
  }, [title, sections, currentProject]);

  // Auto-fill from project data
  const autoFill = useCallback(() => {
    if (!currentProject?.scraped_data) return;
    const data = currentProject.scraped_data;
    const filled: LandingSection[] = [
      {
        id: crypto.randomUUID(), type: 'hero',
        title: data.title || currentProject.name,
        subtitle: data.description,
        buttonText: 'Get Started',
        buttonUrl: currentProject.url,
      },
      {
        id: crypto.randomUUID(), type: 'features',
        title: 'Features',
        items: (data.features || []).slice(0, 6).map((f) => ({
          title: f.split(' ').slice(0, 4).join(' '),
          description: f,
          icon: '✨',
        })),
      },
      {
        id: crypto.randomUUID(), type: 'cta',
        title: `Try ${currentProject.name} Today`,
        subtitle: data.description,
        buttonText: 'Visit Website',
        buttonUrl: currentProject.url,
      },
    ];
    setSections(filled);
    setTitle(`${currentProject.name} — Landing Page`);
  }, [currentProject]);

  const getSectionIcon = (type: string) => {
    return SECTION_TYPES.find((t) => t.type === type)?.icon || Layout;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Layout className="w-6 h-6 text-primary-light" />
            Landing Page Builder
          </h1>
          <p className="text-sm text-slate-400 mt-1">Build a landing page from your project data</p>
        </div>
        <div className="flex items-center gap-2">
          {currentProject?.scraped_data && (
            <Button variant="secondary" size="sm" onClick={autoFill}>
              <Sparkles className="w-4 h-4" /> Auto-fill from Project
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={handlePreview}>
            <Eye className="w-4 h-4" /> Preview
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4" /> Export HTML
          </Button>
          {currentProject && (
            <Button size="sm" onClick={handleSave} loading={saving}>
              <Save className="w-4 h-4" /> Save
            </Button>
          )}
        </div>
      </div>

      {/* Page title */}
      <Card>
        <label className="text-xs text-slate-400 mb-1 block">Page Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
        />
      </Card>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, idx) => {
          const Icon = getSectionIcon(section.type);
          const isEditing = editingSection === section.id;
          return (
            <Card key={section.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveSection(section.id, -1)} disabled={idx === 0}
                      className="text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer">
                      <GripVertical className="w-4 h-4 rotate-180" />
                    </button>
                    <button onClick={() => moveSection(section.id, 1)} disabled={idx === sections.length - 1}
                      className="text-slate-500 hover:text-white disabled:opacity-20 cursor-pointer">
                      <GripVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <Icon className="w-5 h-5 text-primary-light" />
                  <div>
                    <span className="text-sm font-medium text-white capitalize">{section.type}</span>
                    <span className="text-xs text-slate-500 ml-2">{section.title}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingSection(isEditing ? null : section.id)}>
                    <Type className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </Button>
                </div>
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Title</label>
                    <input
                      type="text" value={section.title}
                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                      className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  {(section.type === 'hero' || section.type === 'cta') && (
                    <>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Subtitle</label>
                        <input
                          type="text" value={section.subtitle || ''}
                          onChange={(e) => updateSection(section.id, { subtitle: e.target.value })}
                          className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Button Text</label>
                          <input
                            type="text" value={section.buttonText || ''}
                            onChange={(e) => updateSection(section.id, { buttonText: e.target.value })}
                            className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Button URL</label>
                          <input
                            type="text" value={section.buttonUrl || ''}
                            onChange={(e) => updateSection(section.id, { buttonUrl: e.target.value })}
                            className="w-full px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {section.items && (
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 block">Items</label>
                      {section.items.map((item, i) => (
                        <div key={i} className="flex gap-2 items-start">
                          {section.type === 'features' && (
                            <input
                              type="text" value={item.icon || ''} placeholder="Icon"
                              onChange={(e) => updateSectionItem(section.id, i, 'icon', e.target.value)}
                              className="w-12 px-2 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white text-center focus:outline-none focus:border-primary/50"
                            />
                          )}
                          <input
                            type="text" value={item.title} placeholder="Title"
                            onChange={(e) => updateSectionItem(section.id, i, 'title', e.target.value)}
                            className="flex-1 px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
                          />
                          <input
                            type="text" value={item.description} placeholder="Description"
                            onChange={(e) => updateSectionItem(section.id, i, 'description', e.target.value)}
                            className="flex-2 px-3 py-2 bg-surface border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50"
                          />
                          <Button variant="ghost" size="sm" onClick={() => removeSectionItem(section.id, i)}>
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => addSectionItem(section.id)}>
                        <Plus className="w-3.5 h-3.5" /> Add Item
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add section */}
      <Card>
        <p className="text-sm text-slate-400 mb-3">Add a section</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {SECTION_TYPES.map(({ type, label, icon: Icon, desc }) => (
            <button
              key={type}
              onClick={() => addSection(type)}
              className="p-3 rounded-xl border border-white/10 hover:border-primary/30 bg-surface text-center transition-all cursor-pointer group"
            >
              <Icon className="w-5 h-5 text-slate-400 group-hover:text-primary-light mx-auto mb-1" />
              <span className="text-xs font-medium text-white block">{label}</span>
              <span className="text-[10px] text-slate-500">{desc}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Preview modal */}
      {previewHtml && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100 border-b">
              <span className="text-sm font-medium text-slate-700">Preview</span>
              <Button variant="ghost" size="sm" onClick={() => setPreviewHtml(null)}>
                <span className="text-slate-700">Close</span>
              </Button>
            </div>
            <iframe
              srcDoc={previewHtml}
              className="flex-1 w-full"
              title="Landing page preview"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      )}
    </div>
  );
}
