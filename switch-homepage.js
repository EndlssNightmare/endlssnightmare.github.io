#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const mode = process.argv[2];

if (mode === 'dev') {
  // Development mode - remove homepage
  delete packageJson.homepage;
  if (packageJson._homepage) {
    packageJson.homepage = packageJson._homepage;
    delete packageJson._homepage;
  }
  console.log('✅ Switched to development mode (no homepage)');
} else if (mode === 'prod') {
  // Production mode - set homepage for GitHub Pages
  packageJson.homepage = 'https://endlssnightmare.github.io';
  console.log('✅ Switched to production mode (homepage set for GitHub Pages)');
} else {
  console.log('Usage: node switch-homepage.js [dev|prod]');
  console.log('  dev  - Remove homepage for local development');
  console.log('  prod - Set homepage for GitHub Pages deployment');
  process.exit(1);
}

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('package.json updated successfully!');
