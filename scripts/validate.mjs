#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const errors = [];
const warnings = [];

const maturityValues = new Set([
  'stable_standard',
  'open_protocol',
  'community_standard',
  'emerging_convention',
  'experimental',
  'local_pattern',
  'pattern_only'
]);
const contextTypes = new Set([
  'specification_docs',
  'architecture_graph',
  'operating_context',
  'workflow_context',
  'standards_reference'
]);
const contextStatuses = new Set(['active', 'draft', 'deprecated']);
const sensitivities = new Set(['public', 'internal', 'private', 'restricted']);
const lossinessValues = new Set(['none', 'low', 'medium', 'high']);
const crosswalkMaturityValues = new Set([
  'stable_standard',
  'open_protocol',
  'community_standard',
  'emerging_convention',
  'experimental',
  'pattern_only'
]);

function addError(file, message) {
  errors.push(`${file}: ${message}`);
}

function addWarning(file, message) {
  warnings.push(`${file}: ${message}`);
}

function rel(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function readJson(file) {
  try {
    return JSON.parse(readText(file));
  } catch (error) {
    addError(rel(file), `invalid JSON: ${error.message}`);
    return null;
  }
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function textFiles() {
  const allowedExts = new Set(['.md', '.txt', '.json', '.mjs', '.js', '.yml', '.yaml']);
  const allowedBasenames = new Set(['LICENSE', '.gitignore']);
  return walk(root).filter((file) => allowedExts.has(path.extname(file)) || allowedBasenames.has(path.basename(file)));
}

function validateAsciiAndWhitespace() {
  for (const file of textFiles()) {
    const fileRel = rel(file);
    const text = readText(file);
    for (let i = 0; i < text.length; i += 1) {
      if (text.charCodeAt(i) > 127) {
        addError(fileRel, `contains non-ASCII character ${JSON.stringify(text[i])}`);
        break;
      }
    }
    if (text.includes('\r')) addError(fileRel, 'contains CRLF or carriage returns');
    const lines = text.split('\n');
    lines.forEach((line, index) => {
      if (/[ \t]$/.test(line)) addError(fileRel, `trailing whitespace on line ${index + 1}`);
    });
    if (!text.endsWith('\n')) addError(fileRel, 'missing trailing newline');
  }
}


function expectNonEmptyString(fileRel, obj, key, scope) {
  if (typeof obj[key] !== 'string' || obj[key].trim() === '') {
    addError(fileRel, `${scope} ${key} must be a non-empty string`);
  }
}

function rejectUnknownKeys(fileRel, obj, allowed, scope) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) addError(fileRel, `${scope} has unknown key ${key}`);
  }
}

function validateSchemas() {
  const schemaDir = path.join(root, 'schemas');
  const files = fs.readdirSync(schemaDir).filter((name) => name.endsWith('.schema.json')).sort();
  const llms = readText(path.join(root, 'llms.txt'));
  const schemaDocs = [
    readText(path.join(root, 'README.md')),
    readText(path.join(root, 'SPEC.md')),
    readText(path.join(root, 'docs', 'validation.md')),
    llms
  ].join('\n');
  for (const name of files) {
    const file = path.join(schemaDir, name);
    const fileRel = rel(file);
    const schema = readJson(file);
    if (!schema) continue;
    for (const key of ['$schema', '$id', 'title', 'description', 'type', 'properties']) {
      if (!(key in schema)) addError(fileRel, `missing required top-level key ${key}`);
    }
    if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') {
      addError(fileRel, 'must use JSON Schema Draft 2020-12');
    }
    if (typeof schema.$id === 'string' && !schema.$id.endsWith(`/schemas/${name}`)) {
      addError(fileRel, `$id must end with /schemas/${name}`);
    }
    if (schema.type !== 'object') addError(fileRel, 'top-level type must be object');
    if (schema.additionalProperties !== false) addError(fileRel, 'top-level additionalProperties must be false');
    if (typeof schema.title !== 'string' || !schema.title.startsWith('pwcli-core ')) {
      addError(fileRel, 'title should start with "pwcli-core "');
    }
    if (typeof schema.description !== 'string' || schema.description.length < 20) {
      addError(fileRel, 'description should be a useful sentence');
    }
    if (schema.required !== undefined && !Array.isArray(schema.required)) {
      addError(fileRel, 'required must be an array when present');
    }
    if (!schemaDocs.includes(`schemas/${name}`)) {
      addError(fileRel, 'schema is not referenced by README, SPEC, llms.txt, or docs/validation.md');
    }
  }
}

function validateCrosswalks() {
  const dir = path.join(root, 'crosswalks');
  const allowedTopLevel = new Set(['id', 'sourceSchema', 'targetSchema', 'maturity', 'mappings']);
  const allowedMapping = new Set(['sourcePath', 'targetPath', 'transform', 'lossiness', 'humanReviewRequired', 'notes']);
  for (const name of fs.readdirSync(dir).filter((file) => file.endsWith('.json')).sort()) {
    const file = path.join(dir, name);
    const fileRel = rel(file);
    const obj = readJson(file);
    if (!obj) continue;
    const expectedId = name.replace(/\.json$/, '');
    const required = ['id', 'sourceSchema', 'targetSchema', 'maturity', 'mappings'];
    rejectUnknownKeys(fileRel, obj, allowedTopLevel, 'crosswalk');
    for (const key of required) if (!(key in obj)) addError(fileRel, `missing ${key}`);
    if (obj.id !== expectedId) addError(fileRel, `id must match filename ${expectedId}`);
    for (const key of ['id', 'sourceSchema', 'targetSchema']) expectNonEmptyString(fileRel, obj, key, 'crosswalk');
    if (!crosswalkMaturityValues.has(obj.maturity)) addError(fileRel, `invalid maturity ${obj.maturity}`);
    if (!Array.isArray(obj.mappings) || obj.mappings.length === 0) {
      addError(fileRel, 'mappings must be a non-empty array');
      continue;
    }
    obj.mappings.forEach((mapping, index) => {
      if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
        addError(fileRel, `mapping ${index} must be an object`);
        return;
      }
      rejectUnknownKeys(fileRel, mapping, allowedMapping, `mapping ${index}`);
      for (const key of ['sourcePath', 'targetPath', 'transform', 'lossiness', 'humanReviewRequired']) {
        if (!(key in mapping)) addError(fileRel, `mapping ${index} missing ${key}`);
      }
      for (const key of ['sourcePath', 'targetPath', 'transform']) expectNonEmptyString(fileRel, mapping, key, `mapping ${index}`);
      if ('notes' in mapping) expectNonEmptyString(fileRel, mapping, 'notes', `mapping ${index}`);
      if (!lossinessValues.has(mapping.lossiness)) addError(fileRel, `mapping ${index} has invalid lossiness`);
      if (typeof mapping.humanReviewRequired !== 'boolean') {
        addError(fileRel, `mapping ${index} humanReviewRequired must be boolean`);
      }
    });
  }
}

function parseScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
}

function parseFrontmatter(text, fileRel) {
  const lines = text.split('\n');
  if (lines[0] !== '---') {
    addError(fileRel, 'missing opening YAML frontmatter marker');
    return null;
  }
  const end = lines.indexOf('---', 1);
  if (end === -1) {
    addError(fileRel, 'missing closing YAML frontmatter marker');
    return null;
  }
  const data = {};
  let activeArray = null;
  for (const line of lines.slice(1, end)) {
    if (!line.trim()) continue;
    const item = line.match(/^\s*-\s*(.+)$/);
    if (item && activeArray) {
      data[activeArray].push(parseScalar(item[1]));
      continue;
    }
    const pair = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!pair) {
      addError(fileRel, `unsupported frontmatter line: ${line}`);
      continue;
    }
    const [, key, raw] = pair;
    if (raw === '') {
      data[key] = [];
      activeArray = key;
    } else {
      data[key] = parseScalar(raw);
      activeArray = null;
    }
  }
  const body = lines.slice(end + 1).join('\n');
  return { data, body };
}

function validateContextPacks() {
  const dir = path.join(root, 'context-pack');
  const allowedFrontmatter = new Set([
    'id',
    'type',
    'title',
    'summary',
    'status',
    'version',
    'scope',
    'sensitivity',
    'tags',
    'related',
    'lastReviewed',
    'domain',
    'maturity',
    'provenance'
  ]);
  for (const name of fs.readdirSync(dir).filter((file) => file.endsWith('.md')).sort()) {
    const file = path.join(dir, name);
    const fileRel = rel(file);
    const parsed = parseFrontmatter(readText(file), fileRel);
    if (!parsed) continue;
    const { data, body } = parsed;
    const required = ['id', 'type', 'title', 'status', 'version', 'domain', 'maturity', 'provenance', 'sensitivity', 'lastReviewed'];
    rejectUnknownKeys(fileRel, data, allowedFrontmatter, 'frontmatter');
    for (const key of required) if (!(key in data)) addError(fileRel, `missing frontmatter key ${key}`);
    const expectedId = name.replace(/\.md$/, '');
    if (data.id !== expectedId) addError(fileRel, `frontmatter id must match filename ${expectedId}`);
    for (const key of ['id', 'title', 'status', 'version', 'domain', 'maturity', 'provenance', 'sensitivity', 'lastReviewed']) {
      expectNonEmptyString(fileRel, data, key, 'frontmatter');
    }
    if (!contextTypes.has(data.type)) addError(fileRel, `invalid type ${data.type}`);
    if (!contextStatuses.has(data.status)) addError(fileRel, `invalid status ${data.status}`);
    if (!maturityValues.has(data.maturity)) addError(fileRel, `invalid maturity ${data.maturity}`);
    if (!sensitivities.has(data.sensitivity)) addError(fileRel, `invalid sensitivity ${data.sensitivity}`);
    for (const key of ['summary', 'scope']) {
      if (key in data) expectNonEmptyString(fileRel, data, key, 'frontmatter');
    }
    for (const key of ['tags', 'related']) {
      if (key in data) {
        if (!Array.isArray(data[key])) {
          addError(fileRel, `${key} must be an array`);
        } else {
          data[key].forEach((item, index) => {
            if (typeof item !== 'string' || item.trim() === '') addError(fileRel, `${key}[${index}] must be a non-empty string`);
          });
        }
      }
    }
    if (typeof data.lastReviewed !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.lastReviewed)) {
      addError(fileRel, 'lastReviewed must be YYYY-MM-DD');
    }
    if (!/^# /m.test(body)) addError(fileRel, 'body must contain an H1 heading');
  }
}

function validateMarkdownLinks() {
  const markdownFiles = walk(root).filter((file) => ['.md', '.txt'].includes(path.extname(file)) && !file.includes(`${path.sep}.git${path.sep}`));
  const linkPattern = /(?<!!)(?:\[[^\]]+\])\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const file of markdownFiles) {
    const fileRel = rel(file);
    const text = readText(file);
    for (const match of text.matchAll(linkPattern)) {
      const target = match[1];
      if (/^(https?:|mailto:)/.test(target) || target.startsWith('#')) continue;
      const clean = target.split('#')[0];
      if (!clean) continue;
      const resolved = path.resolve(path.dirname(file), clean);
      const relativeTarget = path.relative(root, resolved);
      if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
        addError(fileRel, `link escapes repository: ${target}`);
        continue;
      }
      if (!fs.existsSync(resolved)) addError(fileRel, `broken local link: ${target}`);
    }
  }
}

function validatePublicMarkers() {
  const markers = [
    ['README.md', 'MIT-0 OR Apache-2.0'],
    ['README.md', 'Standards Before Invention'],
    ['README.md', 'https://github.com/Protocol-Wealth/nexus-core'],
    ['README.md', 'https://github.com/rivendale'],
    ['LICENSE', 'SPDX-License-Identifier: MIT-0 OR Apache-2.0'],
    ['CONTRIBUTING.md', '## Contribution Licensing'],
    ['SECURITY.md', 'AI must not'],
    ['AGENTS.md', 'npm run validate'],
    ['llms.txt', 'docs/validation.md'],
    ['docs/validation.md', 'npm run validate']
  ];
  for (const [fileRel, marker] of markers) {
    const text = readText(path.join(root, fileRel));
    if (!text.includes(marker)) addError(fileRel, `missing required marker: ${marker}`);
  }
}

function validateSecrets() {
  const patterns = [
    ['private key', /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/],
    ['GitHub token', /\bgh[opsu]_[A-Za-z0-9_]{20,}\b/],
    ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ['OpenAI-style key', /\bsk-[A-Za-z0-9]{20,}\b/],
    ['assigned secret-like environment value', /\b(?:API_KEY|TOKEN|SECRET|PASSWORD)\s*=\s*['"]?[A-Za-z0-9_./+=-]{8,}/i]
  ];
  for (const file of textFiles()) {
    const fileRel = rel(file);
    const text = readText(file);
    for (const [label, pattern] of patterns) {
      if (pattern.test(text)) addError(fileRel, `possible ${label} detected`);
    }
  }
}

function validateWorkflow() {
  const workflow = path.join(root, '.github', 'workflows', 'validate.yml');
  if (!fs.existsSync(workflow)) {
    addError('.github/workflows/validate.yml', 'missing validation workflow');
    return;
  }
  const text = readText(workflow);
  for (const marker of ['npm run validate', 'pull_request', 'push']) {
    if (!text.includes(marker)) addError(rel(workflow), `missing workflow marker ${marker}`);
  }
}

validateAsciiAndWhitespace();
validateSchemas();
validateCrosswalks();
validateContextPacks();
validateMarkdownLinks();
validatePublicMarkers();
validateSecrets();
validateWorkflow();

for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length > 0) {
  console.error(`pwcli-core validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('pwcli-core validation passed');
