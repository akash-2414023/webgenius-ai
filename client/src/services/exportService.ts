import JSZip from 'jszip';
import { GeneratedWebsite } from '../types';

export async function exportToZip(website: GeneratedWebsite): Promise<void> {
  const zip = new JSZip();

  // 1. Add primary standalone index.html
  zip.file('index.html', website.fullCode);

  // 2. Add separated clean structure in /src folder for professional developer handoff
  const srcFolder = zip.folder('src');
  if (srcFolder) {
    if (website.html) {
      srcFolder.file('body.html', website.html);
    }
    if (website.css) {
      srcFolder.file('styles.css', website.css);
    }
    if (website.js) {
      srcFolder.file('script.js', website.js);
    }
  }

  // 3. Add documentation README.md
  const readmeContent = `# ${website.title || 'Generated Website'}

Created with **WebGenius AI** — Production-ready AI Website Builder.

## 🚀 Getting Started

Simply open \`index.html\` in any modern web browser:
\`\`\`bash
# or using a lightweight HTTP server:
npx serve .
\`\`\`

## 🎨 Design & Features
- **Summary**: ${website.summary || 'Custom generated responsive layout'}
- **Styling**: Tailwind CSS via CDN
${website.features ? website.features.map(f => `- ${f}`).join('\n') : ''}

## 📁 File Structure
- \`index.html\`: Complete standalone runnable website
- \`src/body.html\`: Raw HTML body template
- \`src/styles.css\`: Custom style overrides & animations
- \`src/script.js\`: Interactive component handlers
`;

  zip.file('README.md', readmeContent);

  // Generate zip blob and trigger download
  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = `${(website.title || 'webgenius-site').toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export function downloadStandaloneHtml(website: GeneratedWebsite): void {
  const blob = new Blob([website.fullCode], { type: 'text/html;charset=utf-8' });
  const filename = `${(website.title || 'index').toLowerCase().replace(/[^a-z0-9]/g, '-')}.html`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}
