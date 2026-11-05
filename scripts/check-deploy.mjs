// Validates deployment config before production build.
import fs from 'node:fs';

const problems = [];
const vercel = fs.existsSync('vercel.json') ? fs.readFileSync('vercel.json', 'utf8') : '';

if (process.argv.includes('--strict') && vercel.includes('REPLACE-WITH-API-HOST')) {
  problems.push('vercel.json still has the API host placeholder: replace REPLACE-WITH-API-HOST with your real API domain');
}

if (problems.length) {
  console.error(`Deploy check failed:\n - ${problems.join('\n - ')}`);
  process.exit(1);
}

if (vercel.includes('REPLACE-WITH-API-HOST')) {
  console.log('Notice: vercel.json contains placeholder for API host. Set VITE_API_BASE or replace with your backend domain when deploying the API.');
}

console.log('Deploy check passed.');
