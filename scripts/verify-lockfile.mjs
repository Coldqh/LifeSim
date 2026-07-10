import { readFileSync } from 'node:fs';

const lockfile = readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8');
const forbiddenRegistry = 'packages.applied-caas-gateway1.internal.api.openai.org';
const publicRegistry = 'registry.npmjs.org';

if (lockfile.includes(forbiddenRegistry)) {
  console.error(`Invalid package-lock.json: found private registry ${forbiddenRegistry}.`);
  process.exit(1);
}

if (!lockfile.includes(publicRegistry)) {
  console.error(`Invalid package-lock.json: public registry ${publicRegistry} was not found.`);
  process.exit(1);
}

console.log('package-lock.json registry check passed.');
