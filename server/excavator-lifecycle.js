'use strict';

const stages = ['Purchased', 'Transport Pending', 'In Yard', 'Under Repair', 'Ready for Sale',
  'Reserved', 'Local Sale', 'Export Preparation', 'Shipped', 'On Hold', 'Cancelled'];
const workflowStages = new Set(['Local Sale', 'Shipped', 'Sold / Completed']);
const operationalStatuses = new Set(['Available', 'Reserved', 'On Hold', 'Cancelled']);
const pairedStages = new Set(['Reserved', 'On Hold', 'Cancelled']);

function stageStatus(asset, stage, requested) {
  if (requested != null) return requested;
  if (pairedStages.has(stage)) return stage;
  if (pairedStages.has(asset.status)) return 'Available';
  return asset.status;
}

function validateStage(asset, stage, status, { reopen = false } = {}) {
  const previous = asset.lifecycle_stage || 'Purchased';
  if ((pairedStages.has(stage) || pairedStages.has(status)) && stage !== status) {
    return { status: 400, error: 'Reserved, On Hold, and Cancelled must match the machine stage and status.' };
  }
  if (stage === previous && status === asset.status) return null;
  if (Number(asset.archived) || previous === 'Sold / Completed' || asset.status === 'Sold') {
    return { status: 409, error: 'Use the controlled workflow to change a sold or archived machine.' };
  }
  if (workflowStages.has(stage) && stage !== previous || status === 'Sold') {
    return { status: 409, error: 'Use the machine sale or shipment workflow to record this stage.' };
  }
  if ((!stages.includes(stage) && stage !== previous) || (!operationalStatuses.has(status) && status !== asset.status)) {
    return { status: 400, error: 'Select a valid Excavator stage and status.' };
  }
  if ((previous === 'Cancelled' || asset.status === 'Cancelled') && stage !== 'Cancelled' && !reopen) {
    return { status: 409, error: 'Use Reopen Machine and provide a reason before changing a cancelled machine.' };
  }
  return null;
}

module.exports = { stages, validateStage, stageStatus };
