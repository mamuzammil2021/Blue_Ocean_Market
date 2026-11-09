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
  const actionNames = Object.keys(actionPaths);
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
    tooltip.textContent = label;
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
    if (control.childElementCount || control.closest('form') || control.hasAttribute('title')) return;
    const action = names.get(control.textContent.trim());
    if (!action) return;
    const label = document.createElement('span');
    label.className = 'bom-record-action-label';
    label.textContent = control.textContent;
    control.innerHTML = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + actionPaths[action] + '</svg>';
    control.append(label);
    control.classList.add('bom-record-action');
    control.dataset.bomAction = action.toLowerCase();
  }

  function decorate(root) {
    if (tooltipOwner && !tooltipOwner.isConnected) hideTooltip();
    const names = new Map(actionNames.flatMap(name => [[name, name], [translate(name), name]]));
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
    for (const cell of root.querySelectorAll('td.bom-actions-cell')) {
      for (const control of cell.querySelectorAll('button, a.btn')) decorateAction(control, names);
    }
    for (const pager of root.querySelectorAll('.bom-server-pager, .v3391-pager, .v335-pagination, [data-bom-pagination]')) {
      pager.classList.add('bom-record-pager');
    }
  }

  window.BOMRecordLayout = Object.freeze({ decorate });
})();
