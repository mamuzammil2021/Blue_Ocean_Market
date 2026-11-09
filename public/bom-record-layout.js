/* Presentation for record collections. Domain renderers own data and controls. */
(() => {
  'use strict';

  const summaryGroups = [
    '[data-bom-summary]', '.ps-kpis', '.ps315-kpis', '.pack-kpis',
    '.finance-kpis', '.v290-kpis', '.v291-kpis', '.v305-ledger-kpis',
    '.v343-account-kpis', '.v3591-kpis', '.v3592-kpis', '.ps-detail-grid',
    '.v284-summary-grid', '.requirement-summary-grid', '.grid:has(> .stat)',
    '.v356-grid:has(> .v356-kpi)', '.v338-grid-stats',
  ].join(',');
  const filterRows = [
    '[data-bom-filters]', '.ps313-filter', '.finance-filterbar', '.ps315-filterbar',
    '.v320-account-filters', '.v343-statement-controls', '[data-v349-journal]',
    '.qa701-warehouse-filters', '.bom-list-filter > .grid', '.v329-list-toolbar',
    '.v285-section-actions:has(input, select)', '.v318-posting-head > .actions:has(input)',
    '.grid:has(> .field > #excavatorMachineSearch)',
  ].join(',');
  const actionPaths = {
    View: '<path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"/><circle cx="12" cy="12" r="2.5"/>',
    Edit: '<path d="M5 16l11-11a2 2 0 0 1 3 3L8 19H5v-3zM14 7l3 3"/>',
    Print: '<path d="M7 8V4h10v4M7 16H4v-6h16v6h-3M7 14h10v6H7zM16 11h1"/>',
    Download: '<path d="M12 4v11m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  };
  actionPaths.Open = actionPaths.View;
  actionPaths.Delete = '<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/>';
  actionPaths.Remove = actionPaths.Delete;
  actionPaths.Archive = '<path d="M4 4h16v5H4zm1 5v11h14V9m-9 4h4"/>';
  actionPaths.Restore = '<path d="M5 8a8 8 0 1 1-1 8M5 3v5h5"/>';
  actionPaths.Void = '<circle cx="12" cy="12" r="8"/><path d="m6.4 6.4 11.2 11.2"/>';
  const lockedActionPath = '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2"/>';
  const actionAliases = {
    'Open Machine': 'Open', 'Open Source Record': 'Open', 'Open Task': 'Open',
    'Open / Continue': 'Open', 'Open in New Tab': 'Open', 'View Receipt': 'View',
    'View Current Receipt': 'View', 'Delete / Archive': 'Delete', 'Delete Table': 'Delete',
    'Delete Profile': 'Delete', 'Delete Machine': 'Delete', 'Void Payment': 'Void',
    'Edit Meeting': 'Edit', 'Edit / Minutes': 'Edit',
  };
  const actionNames = { ...Object.fromEntries(Object.keys(actionPaths).map(key => [key, key])), ...actionAliases };
  const translate = label => typeof t === 'function' ? t(label) : label;

  let tooltip;
  let tooltipOwner;
  function hideTooltip() {
    if (tooltip) tooltip.hidden = true;
    tooltipOwner = null;
  }
  function showTooltip(control) {
    const label = control.querySelector('.bom-record-action-label')?.textContent.trim();
    if (!label) return;
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = 'bom-record-tooltip';
      tooltip.setAttribute('aria-hidden', 'true');
      document.body.append(tooltip);
    }
    tooltipOwner = control;
    if (tooltip.textContent !== label) tooltip.textContent = label;
    tooltip.hidden = false;
    const rect = control.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const left = Math.min(innerWidth - width - 8, Math.max(8, rect.left + (rect.width - width) / 2));
    tooltip.style.left = left + 'px';
    tooltip.style.top = (rect.top >= tooltip.offsetHeight + 12
      ? rect.top - tooltip.offsetHeight - 6 : rect.bottom + 6) + 'px';
  }

  document.addEventListener('pointerover', event => {
    const control = event.target.closest?.('.bom-record-action');
    if (control && event.pointerType !== 'touch') showTooltip(control);
  });
  document.addEventListener('pointerout', event => {
    if (tooltipOwner?.contains(event.target) && !tooltipOwner.contains(event.relatedTarget)) hideTooltip();
  });
  document.addEventListener('focusin', event => {
    if (event.target.matches('.bom-record-action')) showTooltip(event.target);
  });
  document.addEventListener('focusout', event => {
    if (event.target === tooltipOwner) hideTooltip();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') hideTooltip();
  });
  document.addEventListener('scroll', hideTooltip, true);
  window.addEventListener('resize', hideTooltip);

  function decorateAction(control, names) {
    if (control.dataset.bomAction || control.closest('form') || control.querySelector('button, a, input, select')) return;
    const originalText = control.textContent.trim();
    const locked = control.disabled && originalText.startsWith('🔒');
    const text = originalText.replace(/^[+\s\p{Extended_Pictographic}\uFE0F\u200D]+/u, '');
    const explicitLabel = control.getAttribute('aria-label') || control.title;
    const action = names.get(text) || names.get(explicitLabel);
    if (!action) return;
    const label = document.createElement('span');
    label.className = 'bom-record-action-label';
    label.textContent = explicitLabel || (locked ? originalText : text) || translate(action);
    control.setAttribute('aria-label', locked ? originalText : label.textContent);
    control.removeAttribute('title');
    control.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (locked ? lockedActionPath : actionPaths[action]) + '</svg>';
    control.append(label);
    control.classList.add('bom-record-action');
    control.dataset.bomAction = action.toLowerCase();
  }

  function decorateActionColumn(table, names) {
    const header = table.tHead?.rows[table.tHead.rows.length - 1] || table.rows[0];
    const actionHeader = header?.cells[header.cells.length - 1];
    const headings = new Set(['Action', 'Actions', translate('Action'), translate('Actions'), '작업', '조치']);
    const cells = [...table.rows].map(row => row.cells[row.cells.length - 1])
      .filter(cell => cell?.matches('td.bom-actions-cell') && cell.colSpan === 1 && cell.closest('table') === table);
    if (!cells.length && !headings.has(actionHeader?.textContent.trim())) return;
    if (actionHeader?.tagName === 'TH' && actionHeader.colSpan === 1) {
      actionHeader.classList.add('bom-record-action-column');
    }
    for (const cell of cells) {
      cell.classList.add('bom-record-action-column');
      for (const control of cell.querySelectorAll('button, a.btn')) decorateAction(control, names);
    }
  }

  function decorate(root) {
    if (tooltipOwner && !tooltipOwner.isConnected) hideTooltip();
    const names = new Map(Object.entries(actionNames).flatMap(([name, action]) => [[name, action], [translate(name), action]]));
    for (const group of root.querySelectorAll(summaryGroups)) {
      if (group.children.length) group.classList.add('bom-record-summary');
    }
    for (const row of root.querySelectorAll(filterRows)) {
      row.classList.add('bom-record-filters');
      const next = row.nextElementSibling;
      if (next?.classList.contains('bom-record-summary')) row.before(next);
    }
    for (const heading of root.querySelectorAll('#content .titlebar')) {
      if (heading.parentElement.querySelector('.bom-record-summary, .bom-record-table')) {
        heading.classList.add('bom-record-heading');
      }
    }
    for (const table of root.querySelectorAll('table.bom-record-table')) {
      decorateActionColumn(table, names);
    }
    for (const pager of root.querySelectorAll('.bom-server-pager, .v3391-pager, .v335-pagination, [data-bom-pagination]')) {
      pager.classList.add('bom-record-pager');
    }
  }

  window.BOMRecordLayout = Object.freeze({ decorate });
})();
