import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Render real components with cached fixtures; never call or mutate the running API.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
after(async () => server.close());

async function renderPage(name, fixtures = []) {
  const module = await server.ssrLoadModule(`/src/pages/${name}.tsx`);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const [key, data] of fixtures) client.setQueryData([key], data);
  try {
    return renderToStaticMarkup(React.createElement(QueryClientProvider, { client },
      React.createElement(MemoryRouter, null, React.createElement(module[name]))));
  } finally {
    client.clear();
  }
}

const finding = {
  finding_id: 'TEST-001', entity_id: 'ENTITY-A', severity: 'Critical',
  type: 'Execution gap', description: 'Fixture evidence requires review',
  outcome: 'CONTRADICTED', evidence: { alert_id: 'ALERT-A' },
};

test('all six route components render without crashing', async () => {
  for (const page of ['Overview', 'ClaimsAssurance', 'Findings', 'ReviewQueue', 'Entities', 'Reports']) {
    assert.ok((await renderPage(page)).length > 0, page);
  }
});

test('claims retain assessment and inspection controls', async () => {
  const html = await renderPage('ClaimsAssurance', [['claims-matrix', [
    { claim: '24-hour coverage', status: 'SUPPORTED', demo_text: 'Fixture coverage evidence' },
    { claim: 'Escalation', status: 'UNVERIFIABLE', demo_text: 'Missing evidence' },
  ]]]);
  assert.match(html, /24-hour coverage/);
  assert.match(html, /UNVERIFIABLE/);
  assert.match(html, /Inspect 24-hour coverage/);
});

test('findings retain search, evidence selection, and pagination', async () => {
  const html = await renderPage('Findings', [['findings', [finding]]]);
  for (const text of ['TEST-001', 'ENTITY-A', 'CONTRADICTED', 'Search findings', 'Inspect finding TEST-001', 'Next findings page']) {
    assert.ok(html.includes(text), text);
  }
});

test('review queue retains evidence review and excludes low priority', async () => {
  const html = await renderPage('ReviewQueue', [['all-findings', [finding,
    { ...finding, finding_id: 'LOW-001', severity: 'Low', description: 'Low priority fixture' },
  ]]]);
  assert.match(html, /Fixture evidence requires review/);
  assert.match(html, /Review evidence/i);
  assert.doesNotMatch(html, /Low priority fixture/);
});

test('entity rankings retain actual scores and search', async () => {
  const html = await renderPage('Entities', [['entities-priority', [{
    entity_id: 'ENTITY-A', score: 72, critical_findings: 3, high_findings: 2,
    total_findings: 5, findings_summary: [],
  }]]]);
  assert.match(html, /ENTITY-A/);
  assert.match(html, />72</);
  assert.match(html, /Search entities/);
});
