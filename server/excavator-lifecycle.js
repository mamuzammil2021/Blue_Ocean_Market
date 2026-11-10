'use strict';

const stages = ['Purchased', 'Transport Pending', 'In Yard', 'Under Repair', 'Ready for Sale',
  'Reserved', 'Local Sale', 'Export Preparation', 'Shipped', 'On Hold', 'Cancelled'];
const workflowStages = new Set(['Local Sale', 'Shipped', 'Sold / Completed']);
const operationalStatuses = new Set(['Available', 'Reserved', 'On Hold', 'Cancelled']);

function validateStage(asset, stage, status) {
  const previous = asset.lifecycle_stage || 'Purchased';
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
  return null;
}

module.exports = { stages, validateStage };
