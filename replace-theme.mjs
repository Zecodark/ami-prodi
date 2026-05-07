import { promises as fs } from 'fs';
import path from 'path';

const REPLACEMENTS = [
  // Backgrounds
  [/bg-\[\#0b0a13\]/g, 'bg-slate-50'],
  [/bg-\[\#0f0e17\]/g, 'bg-slate-100'],
  [/bg-\[\#09080f\]/g, 'bg-slate-100'],
  [/bg-\[\#12111a\]/g, 'bg-white'],
  [/bg-white\/5/g, 'bg-white'],
  [/hover:bg-white\/5/g, 'hover:bg-slate-50'],
  [/bg-white\/10/g, 'bg-slate-100'],
  [/hover:bg-white\/10/g, 'hover:bg-slate-100'],
  [/bg-white\/20/g, 'bg-slate-200'],
  
  // Borders
  [/border-white\/5/g, 'border-slate-200'],
  [/border-white\/10/g, 'border-slate-200'],
  [/border-white\/20/g, 'border-slate-300'],
  [/hover:border-white\/20/g, 'hover:border-slate-300'],
  
  // Text Colors
  [/text-slate-200/g, 'text-slate-800'],
  [/text-white\/85/g, 'text-slate-700'],
  [/text-white\/80/g, 'text-slate-700'],
  [/text-white\/70/g, 'text-slate-600'],
  [/text-white\/60/g, 'text-slate-500'],
  [/text-white\/50/g, 'text-slate-500'],
  [/text-white\/45/g, 'text-slate-500'],
  [/text-white\/40/g, 'text-slate-500'],
  [/text-white\/30/g, 'text-slate-400'],
  [/text-white\/20/g, 'text-slate-400'],
  [/text-white/g, 'text-slate-800'],
  [/hover:text-white/g, 'hover:text-slate-900'],
  
  // Specific tweaks
  [/bg-black\/60/g, 'bg-slate-900/40'],
  [/border-t-indigo-500/g, 'border-t-indigo-600'],
  [/text-indigo-300/g, 'text-indigo-700'],
  [/text-indigo-400/g, 'text-indigo-600'],
  [/hover:text-indigo-300/g, 'hover:text-indigo-700'],
  [/hover:text-indigo-200/g, 'hover:text-indigo-800'],
  [/text-red-400/g, 'text-red-600'],
  [/text-red-300/g, 'text-red-700'],
  [/hover:text-red-300/g, 'hover:text-red-700'],
  [/hover:text-red-200/g, 'hover:text-red-800'],
  [/text-emerald-400/g, 'text-emerald-600'],
  [/text-emerald-300/g, 'text-emerald-700'],
  [/hover:text-emerald-300/g, 'hover:text-emerald-700'],
  [/text-amber-400/g, 'text-amber-600'],
  [/text-amber-300/g, 'text-amber-700'],
  [/bg-indigo-500\/15/g, 'bg-indigo-50'],
  [/bg-indigo-500\/20/g, 'bg-indigo-100'],
  [/bg-indigo-500\/10/g, 'bg-indigo-50'],
  [/hover:bg-indigo-500\/20/g, 'hover:bg-indigo-100'],
  [/hover:bg-indigo-500\/10/g, 'hover:bg-indigo-50'],
  [/bg-emerald-500\/20/g, 'bg-emerald-100'],
  [/bg-emerald-500\/10/g, 'bg-emerald-50'],
  [/bg-amber-500\/20/g, 'bg-amber-100'],
  [/bg-amber-500\/10/g, 'bg-amber-50'],
  [/bg-red-500\/20/g, 'bg-red-100'],
  [/bg-red-500\/10/g, 'bg-red-50'],
  [/bg-red-500\/5/g, 'bg-red-50'],
  [/border-indigo-500\/20/g, 'border-indigo-200'],
  [/border-red-500\/20/g, 'border-red-200'],
  [/border-emerald-500\/20/g, 'border-emerald-200'],
  [/border-amber-500\/20/g, 'border-amber-200'],
];

async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      let content = await fs.readFile(fullPath, 'utf-8');
      let originalContent = content;
      
      for (const [regex, replacement] of REPLACEMENTS) {
        content = content.replace(regex, replacement);
      }
      
      if (content !== originalContent) {
        await fs.writeFile(fullPath, content);
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

async function main() {
  const dirs = [
    path.join(process.cwd(), 'app', 'admin'),
    path.join(process.cwd(), 'app', 'dosen'),
    path.join(process.cwd(), 'app', 'login')
  ];
  
  for (const dir of dirs) {
    try {
      await processDirectory(dir);
    } catch (e) {
      console.log(`Skipped ${dir}: ${e.message}`);
    }
  }
  console.log('Done!');
}

main();
