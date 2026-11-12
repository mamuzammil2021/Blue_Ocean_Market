'use strict';

const parents = {
  pinkSaltProcurement: 'purchases',
  pinkSaltInventory: 'inventory',
  pinkSaltSales: 'sales',
  pinkSaltPackaging: 'inventory'
};

function pinkSaltFeature(path, module) {
  const resource = path.match(/^\/(?:v\d+\/)?pink-salt\/([^/]+)/)?.[1];
  if (!resource) return null;
  if (module === 'purchases') return 'pinkSaltProcurement';
  if (module === 'sales') return 'pinkSaltSales';
  if (module === 'inventory') return resource.startsWith('packaging') ? 'pinkSaltPackaging' : 'pinkSaltInventory';
  return null;
}

function inheritPermissions(permissions, actions) {
  const expanded = { ...permissions };
  for (const [feature, parent] of Object.entries(parents)) {
    for (const action of actions) {
      const key = `module.${feature}.${action}`;
      if (expanded[key] === undefined && permissions[`module.${parent}.${action}`] === true) expanded[key] = true;
    }
  }
  return expanded;
}

module.exports = { parents, pinkSaltFeature, inheritPermissions };
