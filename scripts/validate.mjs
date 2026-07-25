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
  const allowedExts = new Set(['.md', '.txt', '.json', '.mjs', '.js', '.ts', '.py', '.toml', '.yml', '.yaml', '.html', '.css']);
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


function expectNonEmptyString(fileRel, obj, key, scope, options = {}) {
  if (!(key in obj)) {
    if (options.optional) return;
    addError(fileRel, `${scope} ${key} must be a non-empty string`);
    return;
  }
  if (typeof obj[key] !== 'string' || obj[key].trim() === '') {
    addError(fileRel, `${scope} ${key} must be a non-empty string`);
  }
}

function rejectUnknownKeys(fileRel, obj, allowed, scope) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) addError(fileRel, `${scope} has unknown key ${key}`);
  }
}


function expectBoolean(fileRel, obj, key, scope) {
  if (typeof obj[key] !== 'boolean') addError(fileRel, `${scope} ${key} must be boolean`);
}

function expectNumberRange(fileRel, obj, key, min, max, scope) {
  if (typeof obj[key] !== 'number' || obj[key] < min || obj[key] > max) {
    addError(fileRel, `${scope} ${key} must be a number between ${min} and ${max}`);
  }
}

function expectStringArray(fileRel, obj, key, scope, options = {}) {
  if (!(key in obj)) {
    if (options.optional) return;
    addError(fileRel, `${scope} ${key} must be an array`);
    return;
  }
  if (!Array.isArray(obj[key])) {
    addError(fileRel, `${scope} ${key} must be an array`);
    return;
  }
  if (options.minItems && obj[key].length < options.minItems) addError(fileRel, `${scope} ${key} must have at least ${options.minItems} item(s)`);
  obj[key].forEach((item, index) => {
    if (typeof item !== 'string' || item.trim() === '') addError(fileRel, `${scope} ${key}[${index}] must be a non-empty string`);
  });
}

function expectEnumString(fileRel, obj, key, allowed, scope, options = {}) {
  if (!(key in obj)) {
    if (options.optional) return;
    addError(fileRel, `${scope} ${key} must be one of: ${Array.from(allowed).join(', ')}`);
    return;
  }
  if (typeof obj[key] !== 'string' || !allowed.has(obj[key])) {
    addError(fileRel, `${scope} ${key} is invalid: ${obj[key]}`);
  }
}

function expectEnumArray(fileRel, obj, key, allowed, scope, options = {}) {
  if (!(key in obj)) {
    if (options.optional) return;
    addError(fileRel, `${scope} ${key} must be an array`);
    return;
  }
  if (!Array.isArray(obj[key])) {
    addError(fileRel, `${scope} ${key} must be an array`);
    return;
  }
  if (options.minItems && obj[key].length < options.minItems) addError(fileRel, `${scope} ${key} must have at least ${options.minItems} item(s)`);
  const seen = new Set();
  obj[key].forEach((item, index) => {
    if (typeof item !== 'string' || !allowed.has(item)) {
      addError(fileRel, `${scope} ${key}[${index}] is invalid: ${item}`);
      return;
    }
    if (seen.has(item)) addError(fileRel, `${scope} ${key} has duplicate value ${item}`);
    seen.add(item);
  });
}

function validateIntentExample(fileRel, example) {
  const allowed = new Set(['schemaVersion', 'domain', 'intent', 'confidence', 'sideEffectLevel', 'approvalRequired', 'sourceRefs', 'fallbackRoute', 'candidatePanels', 'clarifyingQuestions', 'reasonCodes', 'rawInputRef']);
  rejectUnknownKeys(fileRel, example, allowed, 'intent example');
  for (const key of ['schemaVersion', 'domain', 'intent', 'sideEffectLevel', 'fallbackRoute']) expectNonEmptyString(fileRel, example, key, 'intent example');
  if (example.schemaVersion !== '1.0.0') addError(fileRel, 'intent example schemaVersion must be 1.0.0');
  if (!['read_only', 'idempotent_mutation', 'state_change'].includes(example.sideEffectLevel)) addError(fileRel, 'intent example sideEffectLevel is invalid');
  expectNumberRange(fileRel, example, 'confidence', 0, 1, 'intent example');
  expectBoolean(fileRel, example, 'approvalRequired', 'intent example');
  expectStringArray(fileRel, example, 'candidatePanels', 'intent example', { minItems: 1 });
  expectStringArray(fileRel, example, 'sourceRefs', 'intent example', { optional: true });
  expectStringArray(fileRel, example, 'clarifyingQuestions', 'intent example', { optional: true });
  expectStringArray(fileRel, example, 'reasonCodes', 'intent example', { optional: true });
}

function validatePrimitiveExample(fileRel, example) {
  const allowed = new Set(['id', 'title', 'summary', 'domain', 'kind', 'status', 'allowedIntents', 'inputSchemaRef', 'outputModes', 'fallbackRoute', 'sideEffectLevel', 'approvalRequired', 'sourceRequirements', 'supportsReturnFocus', 'publicSafe', 'notes', 'ux']);
  rejectUnknownKeys(fileRel, example, allowed, 'primitive example');
  for (const key of ['id', 'title', 'summary', 'domain', 'kind', 'status', 'fallbackRoute', 'sideEffectLevel']) expectNonEmptyString(fileRel, example, key, 'primitive example');
  if (!['panel', 'card', 'chart', 'form', 'list', 'timeline', 'document_viewer', 'graph', 'wizard'].includes(example.kind)) addError(fileRel, 'primitive example kind is invalid');
  if (!['active', 'beta', 'legacy', 'hidden', 'disabled'].includes(example.status)) addError(fileRel, 'primitive example status is invalid');
  if (!['read_only', 'idempotent_mutation', 'state_change'].includes(example.sideEffectLevel)) addError(fileRel, 'primitive example sideEffectLevel is invalid');
  expectStringArray(fileRel, example, 'allowedIntents', 'primitive example', { minItems: 1 });
  expectStringArray(fileRel, example, 'sourceRequirements', 'primitive example', { optional: true });
  expectBoolean(fileRel, example, 'approvalRequired', 'primitive example');
  expectBoolean(fileRel, example, 'publicSafe', 'primitive example');
  if ('supportsReturnFocus' in example) expectBoolean(fileRel, example, 'supportsReturnFocus', 'primitive example');
  if ('ux' in example) {
    const allowedUx = new Set(['primaryAction', 'previewFields', 'riskLabels', 'costFields', 'emptyState', 'loadingState', 'errorState', 'undoPolicy']);
    if (!example.ux || typeof example.ux !== 'object' || Array.isArray(example.ux)) {
      addError(fileRel, 'primitive example ux must be an object');
    } else {
      rejectUnknownKeys(fileRel, example.ux, allowedUx, 'primitive example ux');
      for (const key of ['primaryAction', 'emptyState', 'loadingState', 'errorState', 'undoPolicy']) {
        if (key in example.ux) expectNonEmptyString(fileRel, example.ux, key, 'primitive example ux');
      }
      for (const key of ['previewFields', 'riskLabels', 'costFields']) expectStringArray(fileRel, example.ux, key, 'primitive example ux', { optional: true });
      if ('undoPolicy' in example.ux && !['immediate_rollback', 'checkpoint_restore', 'non_reversible'].includes(example.ux.undoPolicy)) {
        addError(fileRel, 'primitive example ux undoPolicy is invalid');
      }
    }
  }
}

function validateSourceExample(fileRel, example) {
  const allowed = new Set(['id', 'sourceType', 'protocol', 'metadataFormat', 'sourceIdentifier', 'sourceUrl', 'retrievedAt', 'rights', 'provenanceRef', 'rawRecordRef', 'assertionLayer', 'confidence', 'humanReviewState']);
  const sourceTypes = new Set(['api', 'archive', 'dataset', 'document', 'web_page', 'repository', 'manual_entry']);
  const assertionLayers = new Set(['descriptive_source_metadata', 'interpretive_ai_output']);
  const reviewStates = new Set(['not_required', 'pending', 'approved', 'rejected']);
  rejectUnknownKeys(fileRel, example, allowed, 'source example');
  for (const key of ['id', 'sourceType', 'protocol', 'sourceIdentifier', 'retrievedAt', 'rawRecordRef', 'assertionLayer']) expectNonEmptyString(fileRel, example, key, 'source example');
  expectEnumString(fileRel, example, 'sourceType', sourceTypes, 'source example');
  expectEnumString(fileRel, example, 'assertionLayer', assertionLayers, 'source example');
  expectEnumString(fileRel, example, 'humanReviewState', reviewStates, 'source example', { optional: true });
  if ('confidence' in example) expectNumberRange(fileRel, example, 'confidence', 0, 1, 'source example');
  validateRightsMetadata(fileRel, example.rights);
}

function validateRightsMetadata(fileRel, rights) {
  const scope = 'source example rights';
  const allowed = new Set(['status', 'spdxExpression', 'rightsStatementUri', 'accessRights', 'reuseAllowed', 'humanReviewRequired', 'notes']);
  const statuses = new Set(['open', 'restricted', 'unknown', 'private', 'public_domain']);
  if (!rights || typeof rights !== 'object' || Array.isArray(rights)) {
    addError(fileRel, `${scope} must be an object`);
    return;
  }
  rejectUnknownKeys(fileRel, rights, allowed, scope);
  expectEnumString(fileRel, rights, 'status', statuses, scope);
  expectBoolean(fileRel, rights, 'reuseAllowed', scope);
  expectBoolean(fileRel, rights, 'humanReviewRequired', scope);
  for (const key of ['spdxExpression', 'rightsStatementUri', 'accessRights', 'notes']) {
    expectNonEmptyString(fileRel, rights, key, scope, { optional: true });
  }
}

function validateProvenanceExample(fileRel, example) {
  const allowed = new Set(['entityId', 'activityId', 'agentId', 'wasGeneratedBy', 'wasDerivedFrom', 'wasAttributedTo', 'used', 'startedAtTime', 'endedAtTime', 'generatedAtTime']);
  rejectUnknownKeys(fileRel, example, allowed, 'provenance example');
  for (const key of ['entityId', 'activityId', 'agentId', 'generatedAtTime']) expectNonEmptyString(fileRel, example, key, 'provenance example');
  expectStringArray(fileRel, example, 'wasDerivedFrom', 'provenance example', { optional: true });
  expectStringArray(fileRel, example, 'used', 'provenance example', { optional: true });
}

function validateRuntimeAdapterExample(fileRel, example) {
  const allowed = new Set([
    'id',
    'runtime',
    'title',
    'summary',
    'executionMode',
    'language',
    'license',
    'docsUrl',
    'sideEffectLevel',
    'approvalRequired',
    'auditRequired',
    'redactionRequired',
    'dataAccess',
    'allowedDataClasses',
    'controlPlaneResponsibilities',
    'integrationBoundary',
    'redactionPolicyRefs',
    'mcpCompatible',
    'a2aCompatible',
    'publicSafe',
    'notes',
    'untrustedInputPolicy'
  ]);
  const runtimeValues = new Set(['openai_agents', 'langgraph', 'mcp_server', 'a2a_agent', 'goose', 'claude_code', 'claude_agent_sdk', 'custom']);
  const executionModes = new Set(['local', 'remote', 'sandboxed', 'managed_service', 'hybrid']);
  const sideEffectLevels = new Set(['read_only', 'idempotent_mutation', 'state_change']);
  const dataAccessValues = new Set(['files', 'database', 'browser', 'email', 'documents', 'code', 'calendar', 'private_records', 'tool_outputs', 'memory', 'network', 'none']);
  const dataClassValues = new Set(['public', 'internal', 'confidential', 'restricted', 'pii', 'financial', 'health', 'child_minor', 'secrets']);
  rejectUnknownKeys(fileRel, example, allowed, 'runtime adapter example');
  for (const key of ['id', 'title', 'summary', 'integrationBoundary']) expectNonEmptyString(fileRel, example, key, 'runtime adapter example');
  for (const key of ['language', 'license', 'docsUrl', 'notes']) expectNonEmptyString(fileRel, example, key, 'runtime adapter example', { optional: true });
  if (!/^[a-z][a-z0-9_-]*$/.test(example.id || '')) addError(fileRel, 'runtime adapter example id must be lowercase kebab/snake style');
  expectEnumString(fileRel, example, 'runtime', runtimeValues, 'runtime adapter example');
  expectEnumString(fileRel, example, 'executionMode', executionModes, 'runtime adapter example');
  expectEnumString(fileRel, example, 'sideEffectLevel', sideEffectLevels, 'runtime adapter example');
  for (const key of ['approvalRequired', 'auditRequired', 'redactionRequired', 'publicSafe']) expectBoolean(fileRel, example, key, 'runtime adapter example');
  for (const key of ['mcpCompatible', 'a2aCompatible']) if (key in example) expectBoolean(fileRel, example, key, 'runtime adapter example');
  expectEnumArray(fileRel, example, 'dataAccess', dataAccessValues, 'runtime adapter example', { minItems: 1 });
  expectEnumArray(fileRel, example, 'allowedDataClasses', dataClassValues, 'runtime adapter example', { minItems: 1 });
  expectStringArray(fileRel, example, 'controlPlaneResponsibilities', 'runtime adapter example', { minItems: 1 });
  expectStringArray(fileRel, example, 'redactionPolicyRefs', 'runtime adapter example', { optional: true });
  if (example.redactionRequired) expectStringArray(fileRel, example, 'redactionPolicyRefs', 'runtime adapter example', { minItems: 1 });
  if (example.sideEffectLevel === 'state_change') {
    if (example.approvalRequired !== true) addError(fileRel, 'runtime adapter example state_change requires approvalRequired true');
    if (example.auditRequired !== true) addError(fileRel, 'runtime adapter example state_change requires auditRequired true');
  }
  if (Array.isArray(example.allowedDataClasses) && example.allowedDataClasses.some((klass) => ['restricted', 'pii', 'financial', 'health', 'child_minor', 'secrets'].includes(klass))) {
    if (example.redactionRequired !== true) addError(fileRel, 'runtime adapter example sensitive data classes require redactionRequired true');
    if (example.auditRequired !== true) addError(fileRel, 'runtime adapter example sensitive data classes require auditRequired true');
  }
  validateUntrustedInputPolicy(fileRel, example.untrustedInputPolicy, example);
}

function validateUntrustedInputPolicy(fileRel, policy, adapter) {
  const scope = 'runtime adapter example untrustedInputPolicy';
  const allowed = new Set(['inputSources', 'triggerPolicy', 'secretExposureAllowed', 'networkEgressPolicy', 'tokenPermissions', 'defenses']);
  const inputSourceValues = new Set(['issue', 'pull_request', 'comment', 'document', 'web_page', 'email', 'mcp_tool_output', 'user_upload', 'external_agent_result', 'repo_file', 'manual']);
  const triggerPolicies = new Set(['trusted_human_only', 'trusted_app_only', 'public_read_only', 'disabled']);
  const networkPolicies = new Set(['none', 'allowlist', 'restricted', 'unrestricted']);
  const defenseValues = new Set([
    'quote_untrusted_input',
    'ignore_source_instructions',
    'actor_verification',
    'human_write_access_required',
    'bot_trigger_block',
    'least_privilege_token',
    'secret_scrub',
    'egress_allowlist',
    'tool_argument_allowlist',
    'immutable_input_snapshot',
    'no_public_summaries',
    'split_read_write_workflows',
    'approval_for_mutation',
    'provenance_logging'
  ]);
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    addError(fileRel, `${scope} must be an object`);
    return;
  }
  rejectUnknownKeys(fileRel, policy, allowed, scope);
  expectEnumArray(fileRel, policy, 'inputSources', inputSourceValues, scope, { minItems: 1 });
  expectEnumString(fileRel, policy, 'triggerPolicy', triggerPolicies, scope);
  expectBoolean(fileRel, policy, 'secretExposureAllowed', scope);
  expectEnumString(fileRel, policy, 'networkEgressPolicy', networkPolicies, scope);
  expectStringArray(fileRel, policy, 'tokenPermissions', scope);
  expectEnumArray(fileRel, policy, 'defenses', defenseValues, scope, { minItems: 1 });
  if (policy.secretExposureAllowed === true) {
    addError(fileRel, `${scope} secretExposureAllowed must remain false for public examples`);
  }
  if (policy.networkEgressPolicy === 'unrestricted') {
    addError(fileRel, `${scope} must not use unrestricted network egress in examples`);
  }
  for (const defense of ['quote_untrusted_input', 'ignore_source_instructions', 'secret_scrub', 'provenance_logging']) {
    if (Array.isArray(policy.defenses) && !policy.defenses.includes(defense)) {
      addError(fileRel, `${scope} defenses must include ${defense}`);
    }
  }
  if (policy.networkEgressPolicy !== 'none') {
    for (const defense of ['egress_allowlist', 'tool_argument_allowlist']) {
      if (Array.isArray(policy.defenses) && !policy.defenses.includes(defense)) {
        addError(fileRel, `${scope} defenses must include ${defense} when network egress is enabled`);
      }
    }
  }
  if (adapter && adapter.sideEffectLevel === 'state_change') {
    for (const defense of ['approval_for_mutation', 'split_read_write_workflows']) {
      if (Array.isArray(policy.defenses) && !policy.defenses.includes(defense)) {
        addError(fileRel, `${scope} defenses must include ${defense} for state-changing adapters`);
      }
    }
  }
}

function validateRedactionPolicyExample(fileRel, example) {
  const allowed = new Set(['id', 'title', 'summary', 'scope', 'dataClasses', 'redactionStages', 'actions', 'defaultHandling', 'humanReviewRequired', 'auditRequired', 'retention', 'appliesToRuntimeRefs', 'publicSafe', 'notes']);
  const scopeValues = new Set(['prompt', 'tool_call', 'artifact', 'external_call', 'memory_write', 'all']);
  const dataClassValues = new Set(['public', 'internal', 'confidential', 'restricted', 'pii', 'financial', 'health', 'child_minor', 'secrets']);
  const redactionStageValues = new Set(['before_prompt', 'before_tool', 'before_artifact', 'before_external_call', 'before_memory_write', 'before_log']);
  const actionValues = new Set(['allow', 'mask', 'hash', 'tokenize', 'summarize', 'block', 'require_approval']);
  const defaultHandlingValues = new Set(['allow', 'mask', 'block', 'require_approval']);
  const retentionValues = new Set(['none', 'ephemeral', 'session', 'durable_audit', 'policy_defined']);
  rejectUnknownKeys(fileRel, example, allowed, 'redaction policy example');
  for (const key of ['id', 'title', 'summary']) expectNonEmptyString(fileRel, example, key, 'redaction policy example');
  if (!/^[a-z][a-z0-9_-]*$/.test(example.id || '')) addError(fileRel, 'redaction policy example id must be lowercase kebab/snake style');
  expectEnumString(fileRel, example, 'scope', scopeValues, 'redaction policy example');
  expectEnumArray(fileRel, example, 'dataClasses', dataClassValues, 'redaction policy example', { minItems: 1 });
  expectEnumArray(fileRel, example, 'redactionStages', redactionStageValues, 'redaction policy example', { minItems: 1 });
  expectEnumArray(fileRel, example, 'actions', actionValues, 'redaction policy example', { minItems: 1 });
  expectEnumString(fileRel, example, 'defaultHandling', defaultHandlingValues, 'redaction policy example');
  for (const key of ['humanReviewRequired', 'auditRequired', 'publicSafe']) expectBoolean(fileRel, example, key, 'redaction policy example');
  expectEnumString(fileRel, example, 'retention', retentionValues, 'redaction policy example');
  expectStringArray(fileRel, example, 'appliesToRuntimeRefs', 'redaction policy example', { optional: true });
  if (['restricted', 'pii', 'financial', 'health', 'child_minor', 'secrets'].some((klass) => Array.isArray(example.dataClasses) && example.dataClasses.includes(klass))) {
    if (!Array.isArray(example.actions) || !example.actions.some((action) => ['mask', 'hash', 'tokenize', 'summarize', 'block', 'require_approval'].includes(action))) {
      addError(fileRel, 'redaction policy example sensitive data classes need a protective action');
    }
    if (example.auditRequired !== true) addError(fileRel, 'redaction policy example sensitive data classes require auditRequired true');
  }
}

function validateRunReceiptExample(fileRel, example) {
  const allowed = new Set([
    'schemaVersion',
    'runId',
    'adapterId',
    'intentRef',
    'policyRef',
    'status',
    'startedAt',
    'endedAt',
    'authMode',
    'approval',
    'toolPolicy',
    'redaction',
    'resultDigest',
    'errorCode',
    'rawContentStored'
  ]);
  rejectUnknownKeys(fileRel, example, allowed, 'run receipt example');
  for (const key of ['schemaVersion', 'runId', 'adapterId', 'intentRef', 'policyRef', 'status', 'startedAt', 'endedAt', 'authMode', 'resultDigest']) {
    expectNonEmptyString(fileRel, example, key, 'run receipt example');
  }
  if (example.schemaVersion !== '1.0.0') addError(fileRel, 'run receipt example schemaVersion must be 1.0.0');
  expectEnumString(fileRel, example, 'status', new Set(['succeeded', 'denied', 'failed']), 'run receipt example');
  expectEnumString(fileRel, example, 'authMode', new Set(['api_key', 'bedrock', 'anthropic_aws', 'vertex', 'foundry', 'unavailable']), 'run receipt example');
  expectBoolean(fileRel, example, 'rawContentStored', 'run receipt example');
  if (example.rawContentStored !== false) addError(fileRel, 'run receipt example rawContentStored must remain false');
  if (!example.approval || typeof example.approval !== 'object' || Array.isArray(example.approval)) {
    addError(fileRel, 'run receipt example approval must be an object');
  } else {
    expectBoolean(fileRel, example.approval, 'required', 'run receipt example approval');
    expectNonEmptyString(fileRel, example.approval, 'decision', 'run receipt example approval');
    expectNonEmptyString(fileRel, example.approval, 'reason', 'run receipt example approval');
    if (example.approval.required !== false || example.approval.decision !== 'not_required') {
      addError(fileRel, 'read-only run receipt example approval must be explicitly not_required');
    }
  }
  if (!/^sha256:[a-f0-9]{64}$/.test(example.resultDigest || '')) addError(fileRel, 'run receipt example resultDigest must be a SHA-256 marker');
  if (!example.toolPolicy || typeof example.toolPolicy !== 'object' || Array.isArray(example.toolPolicy)) {
    addError(fileRel, 'run receipt example toolPolicy must be an object');
  } else {
    expectStringArray(fileRel, example.toolPolicy, 'allowedTools', 'run receipt example toolPolicy');
    if (example.toolPolicy.permissionMode !== 'dontAsk') addError(fileRel, 'run receipt example permissionMode must be dontAsk');
    if (example.toolPolicy.networkEgressPolicy !== 'none') addError(fileRel, 'run receipt example networkEgressPolicy must be none');
    if (!example.toolPolicy.toolEventCounts || typeof example.toolPolicy.toolEventCounts !== 'object' || Array.isArray(example.toolPolicy.toolEventCounts)) {
      addError(fileRel, 'run receipt example toolEventCounts must be an object');
    }
  }
  if (!example.redaction || typeof example.redaction !== 'object' || Array.isArray(example.redaction)) {
    addError(fileRel, 'run receipt example redaction must be an object');
  } else {
    for (const key of ['inputFindingCounts', 'outputFindingCounts']) {
      if (!example.redaction[key] || typeof example.redaction[key] !== 'object' || Array.isArray(example.redaction[key])) {
        addError(fileRel, `run receipt example redaction ${key} must be an object`);
      }
    }
  }
}

function validateKnownSchemaExample(fileRel, schemaRef, example) {
  const schemaName = path.basename(schemaRef);
  if (schemaName === 'intent.schema.json') validateIntentExample(fileRel, example);
  if (schemaName === 'primitive.schema.json') validatePrimitiveExample(fileRel, example);
  if (schemaName === 'source.schema.json') validateSourceExample(fileRel, example);
  if (schemaName === 'provenance.schema.json') validateProvenanceExample(fileRel, example);
  if (schemaName === 'runtime-adapter.schema.json') validateRuntimeAdapterExample(fileRel, example);
  if (schemaName === 'redaction-policy.schema.json') validateRedactionPolicyExample(fileRel, example);
  if (schemaName === 'run-receipt.schema.json') validateRunReceiptExample(fileRel, example);
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



function validateExampleSchemas() {
  const files = walk(path.join(root, 'examples')).filter((file) => file.endsWith('.schema.json')).sort();
  for (const file of files) {
    const fileRel = rel(file);
    const schema = readJson(file);
    if (!schema) continue;
    for (const key of ['$schema', '$id', 'title', 'description', 'type', 'properties']) {
      if (!(key in schema)) addError(fileRel, `missing required top-level key ${key}`);
    }
    if (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema') addError(fileRel, 'must use JSON Schema Draft 2020-12');
    if (schema.type !== 'object') addError(fileRel, 'top-level type must be object');
    if (schema.additionalProperties !== false) addError(fileRel, 'top-level additionalProperties must be false');
  }
}

function validateExampleFixtures() {
  const files = walk(path.join(root, 'examples')).filter((file) => path.basename(path.dirname(file)) === 'fixtures' && file.endsWith('.json')).sort();
  const runtimeAdapters = new Map();
  const redactionPolicies = new Map();
  for (const file of files) {
    const fileRel = rel(file);
    const obj = readJson(file);
    if (!obj) continue;
    const allowed = new Set(['schemaRef', 'name', 'summary', 'example']);
    rejectUnknownKeys(fileRel, obj, allowed, 'example fixture');
    for (const key of ['schemaRef', 'name', 'summary']) expectNonEmptyString(fileRel, obj, key, 'example fixture');
    if (!('example' in obj) || !obj.example || typeof obj.example !== 'object' || Array.isArray(obj.example)) {
      addError(fileRel, 'example must be an object');
    }
    if (typeof obj.schemaRef === 'string') {
      const resolved = path.resolve(path.dirname(file), obj.schemaRef);
      const relativeTarget = path.relative(root, resolved);
      if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget)) {
        addError(fileRel, `schemaRef escapes repository: ${obj.schemaRef}`);
      } else if (!fs.existsSync(resolved)) {
        addError(fileRel, `schemaRef does not resolve: ${obj.schemaRef}`);
      } else if (!resolved.endsWith('.schema.json')) {
        addError(fileRel, 'schemaRef must target a .schema.json file');
      } else {
        const schemaName = path.basename(obj.schemaRef);
        validateKnownSchemaExample(fileRel, obj.schemaRef, obj.example);
        if (schemaName === 'runtime-adapter.schema.json' && typeof obj.example.id === 'string') {
          runtimeAdapters.set(obj.example.id, {
            fileRel,
            redactionPolicyRefs: Array.isArray(obj.example.redactionPolicyRefs) ? obj.example.redactionPolicyRefs : []
          });
        }
        if (schemaName === 'redaction-policy.schema.json' && typeof obj.example.id === 'string') {
          redactionPolicies.set(obj.example.id, {
            fileRel,
            appliesToRuntimeRefs: Array.isArray(obj.example.appliesToRuntimeRefs) ? obj.example.appliesToRuntimeRefs : []
          });
        }
      }
    }
  }
  for (const [id, adapter] of runtimeAdapters) {
    for (const policyRef of adapter.redactionPolicyRefs) {
      if (!redactionPolicies.has(policyRef)) {
        addError(adapter.fileRel, `runtime adapter ${id} references missing redaction policy ${policyRef}`);
      }
    }
  }
  for (const [id, policy] of redactionPolicies) {
    for (const runtimeRef of policy.appliesToRuntimeRefs) {
      if (!runtimeAdapters.has(runtimeRef)) {
        addError(policy.fileRel, `redaction policy ${id} applies to missing runtime adapter ${runtimeRef}`);
      }
    }
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
validateExampleSchemas();
validateExampleFixtures();
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
