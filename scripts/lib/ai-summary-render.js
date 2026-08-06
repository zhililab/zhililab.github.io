'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  computeSourceHash,
  validateSummary
} = require('./ai-summary');
const { isAiSummaryRequired } = require('./ai-summary-eligibility');

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderAiSummary(summary) {
  const slug = escapeHtml(summary.slug);
  const general = escapeHtml(summary.general);
  const bullets = summary.bullets.map(bullet => `        <li>${escapeHtml(bullet)}</li>`).join('\n');
  const explainer = escapeHtml(summary.explainer);
  const prefix = `ai-summary-${slug}`;

  return [
    '<details class="ai-summary" data-ai-summary>',
    '  <summary>✦ 阅读 AI 生成摘要</summary>',
    '  <p class="ai-summary__disclosure">AI 生成 · 已由作者审核 · 仅供快速预览，请以原文为准</p>',
    `  <div class="ai-summary__tabs" role="tablist" aria-label="${escapeHtml('文章摘要')}" aria-orientation="horizontal">`,
    `    <button type="button" role="tab" id="${prefix}-tab-overview" aria-controls="${prefix}-panel-overview" aria-selected="true" tabindex="0">概览</button>`,
    `    <button type="button" role="tab" id="${prefix}-tab-points" aria-controls="${prefix}-panel-points" aria-selected="false" tabindex="-1">要点</button>`,
    `    <button type="button" role="tab" id="${prefix}-tab-explainer" aria-controls="${prefix}-panel-explainer" aria-selected="false" tabindex="-1">通俗解释</button>`,
    '  </div>',
    `  <section role="tabpanel" id="${prefix}-panel-overview" aria-labelledby="${prefix}-tab-overview" aria-label="${escapeHtml('概览')}">`,
    `    <p>${general}</p>`,
    '  </section>',
    `  <section role="tabpanel" id="${prefix}-panel-points" aria-labelledby="${prefix}-tab-points" aria-label="${escapeHtml('要点')}" hidden>`,
    '    <ul>',
    bullets,
    '    </ul>',
    '  </section>',
    `  <section role="tabpanel" id="${prefix}-panel-explainer" aria-labelledby="${prefix}-tab-explainer" aria-label="${escapeHtml('通俗解释')}" hidden>`,
    `    <p>${explainer}</p>`,
    '  </section>',
    '</details>'
  ].join('\n');
}

function bodyFromRaw(raw) {
  const source = String(raw || '');
  if (!source.startsWith('---')) return source;

  const lines = source.split(/\r?\n/);
  if (lines[0].trim() !== '---') return source;
  const end = lines.findIndex((line, index) => index > 0 && /^(---|\.\.\.)\s*$/.test(line));
  return end === -1 ? source : lines.slice(end + 1).join('\n');
}

function isPost(data) {
  return Boolean(data && ((data.page && data.page.layout === 'post') || data.layout === 'post'));
}

function summaryPath(summariesDir, slug) {
  return path.join(summariesDir, `${slug}.json`);
}

function createAiSummaryFilter({ summariesDir }) {
  return data => {
    if (!isPost(data)) return data;

    const slug = data.slug;
    const required = isAiSummaryRequired({
      slug,
      date: data.date,
      aiSummary: data.ai_summary
    });
    if (!required) return data;

    const filePath = summaryPath(summariesDir, slug);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required AI summary is missing for post "${slug}".`);
    }

    let summary;
    try {
      summary = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Required AI summary is invalid JSON for post "${slug}": ${error.message}`);
    }

    let validated;
    try {
      validated = validateSummary(summary, { slug });
    } catch (error) {
      throw new Error(`Required AI summary is invalid for post "${slug}": ${error.message}`);
    }

    if (validated.status !== 'approved') {
      throw new Error(`Required AI summary must be approved for post "${slug}".`);
    }

    const expectedHash = computeSourceHash(bodyFromRaw(data.raw));
    if (validated.source_hash !== expectedHash) {
      throw new Error(`Required AI summary is not current for post "${slug}" (source hash mismatch).`);
    }

    if (!data.description && !data.excerpt) {
      data.description = data.content;
    }
    data.content = `${renderAiSummary(validated)}\n${data.content}`;
    return data;
  };
}

module.exports = {
  createAiSummaryFilter,
  escapeHtml,
  renderAiSummary
};
