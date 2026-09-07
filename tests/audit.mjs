import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
const failures = [];

function fail(file, message) { failures.push(`${file}: ${message}`); }

for (const file of htmlFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const markupOnly = source.replace(/<script[\s\S]*?<\/script>/gi, '');
  const ids = [...markupOnly.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) fail(file, `IDs dupliqués: ${duplicates.join(', ')}`);

  for (const match of source.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
    try { new vm.Script(match[1], { filename: file }); }
    catch (error) { fail(file, `JavaScript invalide: ${error.message}`); }
  }

  for (const match of source.matchAll(/\bhref=["']([^"'#?]+\.html)(?:[?#][^"']*)?["']/gi)) {
    if (!fs.existsSync(path.join(root, match[1]))) fail(file, `lien local absent: ${match[1]}`);
  }
}

const allHtml = htmlFiles.map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('\n');
if (/eylacare2025/i.test(allHtml)) fail('global', 'ancien mot de passe admin encore présent');
if (/id=["']card(Number|Cvv|Expiry|Name)["']/i.test(allHtml)) fail('global', 'champ bancaire simulé encore présent');
if (!fs.existsSync(path.join(root, 'supabase/migrations/20260907_pilot_security.sql'))) {
  fail('global', 'migration RLS pilote absente');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Audit statique réussi: ${htmlFiles.length} pages contrôlées.`);
