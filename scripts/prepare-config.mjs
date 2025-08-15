#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const templatePath = join(projectRoot, 'wrangler.template.jsonc');
const configPath = join(projectRoot, 'wrangler.jsonc');

/**
 * Generate wrangler config from template using environment variables.
 * This script is intended to be called explicitly in CI/CD environments.
 */
function generateConfigFromTemplate() {
  console.log('🔧 Generating wrangler config from template with environment variables');
  
  const requiredEnvVars = ['D1_DATABASE_ID'];
  const missing = requiredEnvVars.filter((k) => !process.env[k] || process.env[k].trim() === '');
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const templateRaw = readFileSync(templatePath, 'utf8');
  const rendered = templateRaw
    .replaceAll('${D1_DATABASE_ID}', process.env.D1_DATABASE_ID);

  writeFileSync(configPath, rendered, 'utf8');
  console.log(`✅ Generated ${configPath} from template with D1_DATABASE_ID=${process.env.D1_DATABASE_ID}`);
}

generateConfigFromTemplate();
