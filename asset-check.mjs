import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const css = await readFile(path.join(root, 'style.css'), 'utf8');
const script = await readFile(path.join(root, 'script.js'), 'utf8');
const references = [];

for (const match of html.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) {
  references.push(match[1]);
}
for (const match of html.matchAll(/\bdata-image\s*=\s*["']([^"']+)["']/gi)) {
  references.push(match[1]);
}
for (const match of css.matchAll(/url\(\s*["']?([^)'"\s]+)["']?\s*\)/gi)) {
  references.push(match[1]);
}

const localPaths = [...new Set(references
  .filter((value) => !/^(?:[a-z]+:|\/\/|#|data:)/i.test(value))
  .map((value) => decodeURIComponent(value.split(/[?#]/, 1)[0]))
  .filter(Boolean))];
const failures = [];
const referencedImages = [];

function imageFormat(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'jpg';
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (bytes.toString('utf8').trimStart().startsWith('<svg')) return 'svg';
  return 'unknown';
}

for (const ref of localPaths) {
  const absolute = path.resolve(root, ref);
  if (!absolute.startsWith(root + path.sep)) {
    failures.push(`Reference escapes the project folder: ${ref}`);
    continue;
  }
  try {
    const info = await stat(absolute);
    if (!info.isFile()) throw new Error('not a file');
    const ext = path.extname(ref).toLowerCase().replace('.', '');
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      const bytes = await readFile(absolute);
      const detected = imageFormat(bytes.subarray(0, 512));
      const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
      if (detected !== normalizedExt) failures.push(`Image type mismatch: ${ref} is ${detected}, filename says ${normalizedExt}`);
      referencedImages.push(ref);
    }
    if (ext === 'pdf') {
      const handle = await readFile(absolute);
      if (handle.toString('ascii', 0, 4) !== '%PDF') failures.push(`Invalid PDF signature: ${ref}`);
    }
    if (ext === 'mp4') {
      const { open } = await import('node:fs/promises');
      const handle = await open(absolute, 'r');
      try {
        const header = Buffer.alloc(12);
        await handle.read(header, 0, 12, 0);
        if (header.toString('ascii', 4, 8) !== 'ftyp') failures.push(`Invalid MP4 signature: ${ref}`);
      } finally {
        await handle.close();
      }
    }
  } catch (error) {
    failures.push(`Missing or unreadable local file: ${ref} (${error.message})`);
  }
}

const required = [
  'james.jpg',
  'github-icon.png',
  'assets/research/page-05-blurred.png',
  'assets/research/page-04-findings.png',
  'assets/research/page-03-methodology.png',
  'assets/research/page-02-abstract.png',
  'assets/research/page-01-title.png',
  'Cybersecurity.png',
  'PT.png',
  'james_RESUME V2.pdf',
  'assets/projects/medisync/chat-interface.png',
  'assets/projects/medisync/rare-disease-analysis.png',
  'assets/projects/medisync/code-view-clean.png',
  'assets/projects/smart-parking/mobile-dashboard-clean.png',
  'assets/projects/database-scheduler/calendar-code.png',
  'assets/projects/database-scheduler/add-task-form.png',
  'assets/projects/database-scheduler/database-structure.png',
  'assets/videos/EDP_SmartParking_Demonstration.mp4',
  'assets/tools/canva.webp',
  'assets/tools/zoho-books.png',
];
for (const ref of required) {
  if (!localPaths.includes(ref)) failures.push(`Required site asset is not referenced: ${ref}`);
}

const email = 'jamesfederipe3@gmail.com';
if (!html.includes(`mailto:${email}`) || !html.includes(email)) failures.push('Contact email or mailto link is missing or incorrect.');
if (html.includes('Formated MediSync Proposal.pdf')) failures.push('The private full research paper must not be linked from the site.');
if (html.includes('empty-media-slot')) failures.push('Blank project-media placeholders must not be displayed.');
for (const skill of ['OpenAI API', 'Gemini API', 'Cybersecurity']) {
  if (!html.includes(skill)) failures.push(`Required portfolio skill is missing: ${skill}.`);
}
for (const profile of ['https://github.com/Percyvilli', 'https://x.com/percyvillii', 'https://www.instagram.com/federipejames/']) {
  if (!html.includes(profile)) failures.push(`Verified profile link is missing: ${profile}.`);
}
if (!html.includes('class="research-dialog"') || !html.includes('class="research-dialog-scroll"') || !script.includes('researchDialog.showModal()') || !html.includes('Open scrollable paper preview')) failures.push('The scrollable paper preview dialog is missing.');
for (const page of ['page-01-title.png','page-02-abstract.png','page-03-methodology.png','page-04-findings.png','page-05-blurred.png']) {
  if (!html.includes(`src="assets/research/${page}"`)) failures.push(`Research preview page is missing: ${page}.`);
}
if (html.includes('Formated MediSync Proposal.pdf')) failures.push('The complete manuscript must not be linked from the site.');
if (!html.includes('class="image-dialog"') || !script.includes('imageDialog.showModal()') || !script.includes("event.key === 'Escape'")) failures.push('Accessible image preview dialog wiring is missing.');
if (!html.includes('github-icon.png')) failures.push('The supplied GitHub logo is not used.');
if (!script.includes("video.addEventListener('play'") || !script.includes('videoVisibility') || !script.includes('document.hidden')) failures.push('Video pause coordination is missing.');
if (!html.includes('data-image="assets/projects/medisync/chat-interface.png"') || !html.includes('data-image="assets/projects/smart-parking/mobile-dashboard-clean.png"') || !html.includes('data-image="assets/projects/database-scheduler/add-task-form.png"')) failures.push('Project image preview buttons are missing.');

const videoCount = [...html.matchAll(/<video\b[\s\S]*?<\/video>/gi)].length;
if (videoCount !== 6) failures.push(`Expected six video players; found ${videoCount}.`);
if (!html.includes('preload="none"') || /<video[^>]*\bautoplay\b/i.test(html)) failures.push('Video players must not preload full media or autoplay.');

console.log(`Local references checked: ${localPaths.length}`);
console.log(`Referenced images checked: ${referencedImages.length}`);
console.log(`Video players: ${videoCount}`);
console.log(`Resume exists: ${localPaths.includes('james_RESUME V2.pdf')}`);
console.log(`Contact: ${email}`);
if (failures.length) {
  console.error('\nFAILED CHECKS');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('All static asset, signature, contact, certificate, gallery, preview dialog, and video checks passed.');
}
