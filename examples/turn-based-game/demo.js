const cloneData = (value) => JSON.parse(JSON.stringify(value));

const initialGameState = Object.freeze({
  playerEnergy: 5,
  playerHealth: 100,
  rivalEnergy: 4,
  rivalHealth: 100,
  activeEffects: ['clear weather', 'no shield']
});

const sourceRecords = [
  {
    id: 'state:turn-game:turn-1',
    assertionLayer: 'descriptive_source_metadata',
    statement: 'Player has 5 energy, rival has 4 energy, rival health is 100.',
    retrievedAt: '2026-07-03T00:00:00Z'
  }
];

const primitiveRegistry = {
  'turn-preview': {
    id: 'turn-preview',
    title: 'Turn Preview',
    summary: 'Preview a state-changing turn command before deterministic resolution.',
    domain: 'turn_game',
    kind: 'panel',
    status: 'active',
    allowedIntents: ['card_play:pressure_raid'],
    fallbackRoute: '/turn-game/hand',
    sideEffectLevel: 'state_change',
    approvalRequired: true,
    publicSafe: true,
    supportsReturnFocus: true,
    ux: {
      primaryAction: 'Commit Raid Sequence',
      previewFields: ['target', 'expectedDamage', 'expectedDrain'],
      riskLabels: ['Counter card possible if rival energy drops below 3'],
      costFields: ['energyCost', 'cardSlotCost'],
      emptyState: 'No preview is available until intent compiles.',
      loadingState: 'Compiling tactical intent...',
      errorState: 'Action blocked by deterministic validation.',
      undoPolicy: 'checkpoint_restore'
    }
  }
};

const app = {
  state: cloneData(initialGameState),
  telemetry: null,
  ledger: [],
  workflowState: 'console'
};

const commandEl = document.querySelector('#command');
const compileEl = document.querySelector('#compile');
const approveEl = document.querySelector('#approve');
const rejectEl = document.querySelector('#reject');
const resetEl = document.querySelector('#reset');
const previewEl = document.querySelector('#preview');
const ledgerEl = document.querySelector('#ledger');
const gameStateEl = document.querySelector('#game-state');
const approvalPillEl = document.querySelector('#approval-pill');

function parseCommand(command) {
  const normalized = command.toLowerCase().trim();
  const pressureRaid = normalized.includes('pressure') && normalized.includes('raid');
  const rivalCore = normalized.includes('core') || normalized.includes('rival');

  if (!pressureRaid || !rivalCore) {
    return {
      schemaVersion: '1.0.0',
      domain: 'turn_game',
      intent: 'clarify_command',
      confidence: 0.34,
      sideEffectLevel: 'read_only',
      approvalRequired: false,
      sourceRefs: ['state:turn-game:turn-1'],
      fallbackRoute: '/turn-game/hand',
      candidatePanels: ['turn-preview'],
      clarifyingQuestions: ['Do you want to inspect your hand, preview a raid, or end the turn?'],
      reasonCodes: ['low_confidence:missing_pressure_raid']
    };
  }

  return {
    schemaVersion: '1.0.0',
    domain: 'turn_game',
    intent: 'card_play:pressure_raid',
    confidence: 0.96,
    sideEffectLevel: 'state_change',
    approvalRequired: true,
    sourceRefs: ['state:turn-game:turn-1'],
    fallbackRoute: '/turn-game/hand',
    candidatePanels: ['turn-preview'],
    reasonCodes: ['keyword:pressure_raid', 'target:rival_core', 'mode:intermediate'],
    rawInputRef: 'local-demo-command'
  };
}

function computePreview(telemetry) {
  if (telemetry.intent !== 'card_play:pressure_raid') {
    return {
      valid: false,
      error: 'The command needs clarification before a state-changing preview can hydrate.'
    };
  }

  const energyCost = 3;
  if (app.state.playerEnergy < energyCost) {
    return {
      valid: false,
      error: 'Insufficient energy for pressure raid.'
    };
  }

  return {
    valid: true,
    target: 'rival core',
    energyCost,
    cardSlotCost: 1,
    expectedDamage: 45,
    expectedDrain: 1,
    resultingPlayerEnergy: app.state.playerEnergy - energyCost,
    resultingRivalHealth: Math.max(0, app.state.rivalHealth - 45),
    resultingRivalEnergy: Math.max(0, app.state.rivalEnergy - 1),
    advisorInterpretation: {
      assertionLayer: 'interpretive_ai_output',
      statement: 'Pressure raid is strong tempo if the player accepts counter-card risk.',
      confidence: 0.74
    }
  };
}

function hydratePrimitive(telemetry) {
  return primitiveRegistry[telemetry.candidatePanels[0]];
}

function executeTransaction() {
  const preview = computePreview(app.telemetry);
  if (!preview.valid) return;

  app.state = {
    ...app.state,
    playerEnergy: preview.resultingPlayerEnergy,
    rivalHealth: preview.resultingRivalHealth,
    rivalEnergy: preview.resultingRivalEnergy
  };

  app.ledger.push({
    id: `ledger-${app.ledger.length + 1}`,
    timestamp: new Date().toISOString(),
    actor: 'player',
    intent: app.telemetry.intent,
    energySpent: preview.energyCost,
    payload: {
      damageApplied: preview.expectedDamage,
      energyDrained: preview.expectedDrain,
      resultingPlayerEnergy: preview.resultingPlayerEnergy,
      resultingRivalHealth: preview.resultingRivalHealth,
      resultingRivalEnergy: preview.resultingRivalEnergy
    },
    sourceRefs: app.telemetry.sourceRefs
  });

  app.workflowState = 'return_focus';
  app.telemetry = null;
  render();
}

function renderGameState() {
  const rows = [
    ['Workflow State', app.workflowState],
    ['Player Energy', app.state.playerEnergy],
    ['Player Health', app.state.playerHealth],
    ['Rival Energy', app.state.rivalEnergy],
    ['Rival Health', app.state.rivalHealth]
  ];
  gameStateEl.innerHTML = rows.map(([label, value]) => `
    <div class="stat">
      <dt>${escapeHtml(String(label))}</dt>
      <dd>${escapeHtml(String(value))}</dd>
    </div>
  `).join('');
}

function renderPreview() {
  if (!app.telemetry) {
    approvalPillEl.textContent = 'Waiting';
    approvalPillEl.className = 'pill muted';
    previewEl.className = 'preview-empty';
    previewEl.textContent = 'Compile a command to hydrate the registered panel.';
    approveEl.disabled = true;
    rejectEl.disabled = true;
    return;
  }

  const primitive = hydratePrimitive(app.telemetry);
  const preview = computePreview(app.telemetry);
  const approvalReady = app.telemetry.approvalRequired && preview.valid;
  approvalPillEl.textContent = approvalReady ? 'Approval required' : 'Read only';
  approvalPillEl.className = approvalReady ? 'pill muted' : 'pill';
  approveEl.disabled = !approvalReady;
  rejectEl.disabled = false;

  const sourceHtml = sourceRecords.map((record) => `<li><strong>${escapeHtml(record.assertionLayer)}</strong>: ${escapeHtml(record.statement)}</li>`).join('');
  const interpretationHtml = preview.advisorInterpretation
    ? `<li><strong>${escapeHtml(preview.advisorInterpretation.assertionLayer)}</strong>: ${escapeHtml(preview.advisorInterpretation.statement)} Confidence ${escapeHtml(String(preview.advisorInterpretation.confidence))}</li>`
    : '<li>No interpretation generated.</li>';
  const riskHtml = listHtml(primitive.ux.riskLabels);
  const costHtml = listHtml(primitive.ux.costFields);

  previewEl.className = '';
  previewEl.innerHTML = `
    <div class="section">
      <h3>Intent Telemetry</h3>
      <pre>${escapeHtml(JSON.stringify(app.telemetry, null, 2))}</pre>
    </div>
    <div class="section">
      <h3>Registered Primitive</h3>
      <ul>
        <li>${escapeHtml(primitive.title)}</li>
        <li>Fallback route: ${escapeHtml(primitive.fallbackRoute)}</li>
        <li>Primary action: ${escapeHtml(primitive.ux.primaryAction)}</li>
        <li>Undo policy: ${escapeHtml(primitive.ux.undoPolicy)}</li>
      </ul>
    </div>
    <div class="section">
      <h3>Risk Labels</h3>
      <ul>${riskHtml}</ul>
    </div>
    <div class="section">
      <h3>Cost Fields</h3>
      <ul>${costHtml}</ul>
    </div>
    <div class="section">
      <h3>Preview</h3>
      ${preview.valid ? `
        <ul>
          <li>Energy cost: ${escapeHtml(String(preview.energyCost))}</li>
          <li>Expected damage: ${escapeHtml(String(preview.expectedDamage))}</li>
          <li>Expected rival energy drain: ${escapeHtml(String(preview.expectedDrain))}</li>
          <li>Resulting player energy: ${escapeHtml(String(preview.resultingPlayerEnergy))}</li>
        </ul>
      ` : `<p>${escapeHtml(preview.error)}</p>`}
    </div>
    <div class="section">
      <h3>Assertions</h3>
      <ul>${sourceHtml}</ul>
    </div>
    <div class="section">
      <h3>Interpretation</h3>
      <ul>${interpretationHtml}</ul>
    </div>
  `;
}

function renderLedger() {
  if (app.ledger.length === 0) {
    ledgerEl.className = 'ledger-empty';
    ledgerEl.textContent = 'No ledger events yet.';
    return;
  }
  ledgerEl.className = '';
  ledgerEl.innerHTML = app.ledger.map((event) => `
    <div class="ledger-event">
      <h3>${escapeHtml(event.id)}</h3>
      <p>${escapeHtml(event.timestamp)}</p>
      <pre>${escapeHtml(JSON.stringify(event, null, 2))}</pre>
    </div>
  `).join('');
}

function render() {
  renderGameState();
  renderPreview();
  renderLedger();
}

function listHtml(items) {
  if (!Array.isArray(items) || items.length === 0) return '<li>None declared.</li>';
  return items.map((item) => `<li>${escapeHtml(String(item))}</li>`).join('');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

compileEl.addEventListener('click', () => {
  app.workflowState = 'intent_telemetry';
  app.telemetry = parseCommand(commandEl.value);
  render();
});

approveEl.addEventListener('click', executeTransaction);

rejectEl.addEventListener('click', () => {
  app.workflowState = 'console';
  app.telemetry = null;
  render();
});

resetEl.addEventListener('click', () => {
  app.state = cloneData(initialGameState);
  app.telemetry = null;
  app.ledger = [];
  app.workflowState = 'console';
  render();
});

render();
