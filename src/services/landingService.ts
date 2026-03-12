export interface LandingSection {
  id: string;
  type: 'hero' | 'features' | 'testimonial' | 'cta' | 'pricing' | 'faq';
  title: string;
  subtitle?: string;
  items?: { title: string; description: string; icon?: string }[];
  buttonText?: string;
  buttonUrl?: string;
  bgColor?: string;
}

export interface LandingPage {
  id: string;
  project_id: string;
  title: string;
  slug: string;
  sections: LandingSection[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export async function saveLandingPage(page: LandingPage): Promise<void> {
  const res = await fetch('/api/landing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(page),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to save landing page');
  }
}

export async function getLandingPages(projectId: string): Promise<LandingPage[]> {
  const res = await fetch(`/api/landing?projectId=${encodeURIComponent(projectId)}`);
  const data = await res.json();
  return data.pages || [];
}

export async function deleteLandingPage(id: string, projectId: string): Promise<void> {
  await fetch(`/api/landing?id=${encodeURIComponent(id)}&projectId=${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
  });
}

export function generateLandingHTML(page: LandingPage): string {
  const sections = page.sections.map((s) => {
    switch (s.type) {
      case 'hero':
        return `
    <section style="padding:80px 20px;text-align:center;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff">
      <h1 style="font-size:3rem;font-weight:800;margin-bottom:16px">${esc(s.title)}</h1>
      ${s.subtitle ? `<p style="font-size:1.25rem;opacity:.9;max-width:600px;margin:0 auto 32px">${esc(s.subtitle)}</p>` : ''}
      ${s.buttonText ? `<a href="${esc(s.buttonUrl || '#')}" style="display:inline-block;padding:14px 32px;background:#fff;color:#6366f1;border-radius:12px;font-weight:600;text-decoration:none;font-size:1rem">${esc(s.buttonText)}</a>` : ''}
    </section>`;
      case 'features':
        return `
    <section style="padding:60px 20px;max-width:1000px;margin:0 auto">
      <h2 style="text-align:center;font-size:2rem;margin-bottom:40px;color:#1e293b">${esc(s.title)}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px">
        ${(s.items || []).map(item => `
        <div style="padding:24px;border-radius:16px;border:1px solid #e2e8f0;background:#fff">
          ${item.icon ? `<div style="font-size:2rem;margin-bottom:12px">${esc(item.icon)}</div>` : ''}
          <h3 style="font-size:1.1rem;font-weight:600;color:#1e293b;margin-bottom:8px">${esc(item.title)}</h3>
          <p style="color:#64748b;font-size:.9rem;line-height:1.6">${esc(item.description)}</p>
        </div>`).join('')}
      </div>
    </section>`;
      case 'cta':
        return `
    <section style="padding:60px 20px;text-align:center;background:#f8fafc">
      <h2 style="font-size:2rem;font-weight:700;color:#1e293b;margin-bottom:12px">${esc(s.title)}</h2>
      ${s.subtitle ? `<p style="color:#64748b;font-size:1.1rem;margin-bottom:24px">${esc(s.subtitle)}</p>` : ''}
      ${s.buttonText ? `<a href="${esc(s.buttonUrl || '#')}" style="display:inline-block;padding:14px 32px;background:#6366f1;color:#fff;border-radius:12px;font-weight:600;text-decoration:none">${esc(s.buttonText)}</a>` : ''}
    </section>`;
      case 'testimonial':
        return `
    <section style="padding:60px 20px;background:#f8fafc">
      <h2 style="text-align:center;font-size:2rem;margin-bottom:40px;color:#1e293b">${esc(s.title)}</h2>
      <div style="max-width:800px;margin:0 auto;display:grid;gap:20px">
        ${(s.items || []).map(item => `
        <blockquote style="padding:24px;border-radius:16px;background:#fff;border-left:4px solid #6366f1;margin:0">
          <p style="color:#334155;font-style:italic;margin-bottom:8px">"${esc(item.description)}"</p>
          <cite style="color:#6366f1;font-weight:600;font-style:normal">${esc(item.title)}</cite>
        </blockquote>`).join('')}
      </div>
    </section>`;
      case 'pricing':
        return `
    <section style="padding:60px 20px;max-width:1000px;margin:0 auto">
      <h2 style="text-align:center;font-size:2rem;margin-bottom:40px;color:#1e293b">${esc(s.title)}</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px">
        ${(s.items || []).map(item => `
        <div style="padding:32px;border-radius:16px;border:2px solid #e2e8f0;background:#fff;text-align:center">
          <h3 style="font-size:1.25rem;font-weight:700;color:#1e293b">${esc(item.title)}</h3>
          <p style="color:#64748b;margin:12px 0">${esc(item.description)}</p>
        </div>`).join('')}
      </div>
    </section>`;
      case 'faq':
        return `
    <section style="padding:60px 20px;max-width:800px;margin:0 auto">
      <h2 style="text-align:center;font-size:2rem;margin-bottom:40px;color:#1e293b">${esc(s.title)}</h2>
      ${(s.items || []).map(item => `
      <details style="padding:16px 0;border-bottom:1px solid #e2e8f0">
        <summary style="font-weight:600;color:#1e293b;cursor:pointer;font-size:1rem">${esc(item.title)}</summary>
        <p style="color:#64748b;margin-top:8px;line-height:1.6">${esc(item.description)}</p>
      </details>`).join('')}
    </section>`;
      default:
        return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(page.title)}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1e293b}</style>
</head>
<body>${sections}
</body>
</html>`;
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
