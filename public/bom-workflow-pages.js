/* Explicit presentation owners; existing router, APIs and business controllers retained. */
(()=>{'use strict';
const catalogue=[
  {
    "key": "sale",
    "fn": "saleForm",
    "view": "sales",
    "kind": "new",
    "title": "New product / service sale",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "sales"
    },
    "read": false
  },
  {
    "key": "purchase",
    "fn": "purchaseForm",
    "view": "purchases",
    "kind": "new",
    "title": "New purchase",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "purchases"
    },
    "read": false
  },
  {
    "key": "product",
    "fn": "productForm",
    "view": "inventory",
    "kind": "product-new",
    "title": "Product / Service",
    "args": [
      "id"
    ],
    "edit": "product-edit",
    "params": {},
    "parent": {
      "view": "inventory"
    },
    "read": false
  },
  {
    "key": "user",
    "fn": "userForm",
    "view": "users",
    "kind": "new",
    "title": "Add User",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "users"
    },
    "read": false
  },
  {
    "key": "task",
    "fn": "taskForm",
    "view": "tasks",
    "kind": "new",
    "title": "Assign New Work",
    "args": [
      "id"
    ],
    "edit": "edit",
    "params": {},
    "parent": {
      "view": "tasks"
    },
    "read": false
  },
  {
    "key": "report",
    "fn": "reportForm",
    "view": "reports",
    "kind": "new",
    "title": "Submit Report",
    "args": [
      "type"
    ],
    "edit": null,
    "params": {
      "type": "filter"
    },
    "parent": {
      "view": "reports"
    },
    "read": false
  },
  {
    "key": "meeting",
    "fn": "meetingForm",
    "view": "meetings",
    "kind": "new",
    "title": "Meeting",
    "args": [
      "id"
    ],
    "edit": "edit",
    "params": {},
    "parent": {
      "view": "meetings"
    },
    "read": false
  },
  {
    "key": "performance",
    "fn": "performanceUser",
    "view": "performance",
    "kind": "person",
    "title": "Performance Review",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "performance"
    },
    "read": true
  },
  {
    "key": "review",
    "fn": "performanceReviewForm",
    "view": "performance",
    "kind": "review",
    "title": "Performance Review",
    "args": [
      "userId"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "performance"
    },
    "read": true
  },
  {
    "key": "approval-rule",
    "fn": "approvalRuleForm",
    "view": "approvals",
    "kind": "rule-new",
    "title": "Approval Rule",
    "args": [
      "id"
    ],
    "edit": "rule-edit",
    "params": {},
    "parent": {
      "view": "approvals"
    },
    "read": false
  },
  {
    "key": "equipment",
    "fn": "excavatorAssetForm",
    "view": "excavator",
    "kind": "equipment-new",
    "title": "Excavator Equipment / Deal",
    "args": [
      "id"
    ],
    "edit": "equipment-edit",
    "params": {},
    "parent": {
      "view": "excavator"
    },
    "read": false
  },
  {
    "key": "machine-edit",
    "fn": "excavatorEditMachine",
    "view": "excavator",
    "kind": "machine-edit",
    "title": "Edit Machine",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "excavator",
      "kind": "machine",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "ex-supplier",
    "fn": "excavatorSupplierForm",
    "view": "excavatorSuppliers",
    "kind": "new",
    "title": "Supplier",
    "args": [
      "id"
    ],
    "edit": "edit",
    "params": {},
    "parent": {
      "view": "excavatorSuppliers"
    },
    "read": false
  },
  {
    "key": "supplier-machine",
    "fn": "excavatorSupplierMachineForm",
    "view": "excavatorSuppliers",
    "kind": "machine-new",
    "title": "Supplier Machine",
    "args": [
      "supplierId",
      "machineId"
    ],
    "edit": "machine-edit",
    "params": {
      "supplierId": "scope"
    },
    "parent": {
      "view": "excavatorSuppliers",
      "kind": "supplier",
      "idFrom": "scope",
      "section": "machines"
    },
    "read": false
  },
  {
    "key": "ex-buyer",
    "fn": "excavatorBuyerForm",
    "view": "excavatorBuyers",
    "kind": "new",
    "title": "Buyer",
    "args": [
      "id"
    ],
    "edit": "edit",
    "params": {},
    "parent": {
      "view": "excavatorBuyers"
    },
    "read": false
  },
  {
    "key": "ps-supplier",
    "fn": "psSupplierForm315",
    "view": "psSuppliers",
    "kind": "new",
    "title": "Supplier",
    "args": [
      "id"
    ],
    "edit": "edit",
    "params": {},
    "parent": {
      "view": "psSuppliers"
    },
    "read": false
  },
  {
    "key": "employee",
    "fn": "addEmployeeV29",
    "view": "payroll",
    "kind": "new-employee",
    "title": "Add Employee",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "payroll"
    },
    "read": false
  },
  {
    "key": "employee-edit",
    "fn": "editEmployeeV359",
    "view": "payroll",
    "kind": "edit-employee",
    "title": "Edit Employee",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "payroll",
      "kind": "employee",
      "idFrom": "id",
      "section": "employment"
    },
    "read": true
  },
  {
    "key": "employee-edit-legacy",
    "fn": "editEmployeeV29",
    "view": "payroll",
    "kind": "edit-employee-legacy",
    "title": "Edit Employee",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "payroll",
      "kind": "employee",
      "idFrom": "id",
      "section": "employment"
    },
    "read": true
  },
  {
    "key": "allocation",
    "fn": "editEmployeeAllocationsV29",
    "view": "payroll",
    "kind": "allocation",
    "title": "Cost Allocation",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "payroll",
      "kind": "employee",
      "idFrom": "id",
      "section": "allocation"
    },
    "read": true
  },
  {
    "key": "financial-account",
    "fn": "financialAccountFormV320",
    "view": "systemSettings",
    "kind": "account-new",
    "title": "Company Financial Accounts",
    "args": [
      "id"
    ],
    "edit": "account-edit",
    "params": {},
    "parent": {
      "view": "systemSettings",
      "section": "bank_accounts"
    },
    "read": false
  },
  {
    "key": "pos",
    "fn": "restaurantPOS",
    "view": "restaurant",
    "kind": "pos",
    "title": "MIMI Restaurant",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "restaurant"
    },
    "read": false
  },
  {
    "key": "menu-item",
    "fn": "menuForm",
    "view": "restaurant",
    "kind": "menu-new",
    "title": "Menu Item",
    "args": [
      "id"
    ],
    "edit": "menu-edit",
    "params": {},
    "parent": {
      "view": "restaurant",
      "kind": "menu"
    },
    "read": false
  },
  {
    "key": "buffet",
    "fn": "buffetForm",
    "view": "restaurant",
    "kind": "buffet-new",
    "title": "Buffet",
    "args": [
      "id"
    ],
    "edit": "buffet-edit",
    "params": {},
    "parent": {
      "view": "restaurant",
      "kind": "buffet"
    },
    "read": false
  },
  {
    "key": "recipe",
    "fn": "recipeForm",
    "view": "restaurant",
    "kind": "recipe",
    "title": "Recipe",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "restaurant",
      "kind": "menu"
    },
    "read": true
  },
  {
    "key": "order-edit",
    "fn": "editOpenOrder",
    "view": "restaurant",
    "kind": "order-edit",
    "title": "Edit Order",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "restaurant",
      "kind": "open-orders"
    },
    "read": true
  },
  {
    "key": "restaurant-menu",
    "fn": "restaurantMenu",
    "view": "restaurant",
    "kind": "menu",
    "title": "MIMI Menu Management",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "restaurant"
    },
    "read": false
  },
  {
    "key": "restaurant-stock",
    "fn": "restaurantStock",
    "view": "restaurant",
    "kind": "stock",
    "title": "MIMI Stock Management",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "restaurant"
    },
    "read": false
  },
  {
    "key": "restaurant-weekly",
    "fn": "restaurantWeekly",
    "view": "restaurant",
    "kind": "weekly",
    "title": "MIMI Weekly Menu",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "restaurant"
    },
    "read": false
  },
  {
    "key": "restaurant-buffets",
    "fn": "restaurantBuffet",
    "view": "restaurant",
    "kind": "buffet",
    "title": "MIMI Buffet Management",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "restaurant"
    },
    "read": false
  },
  {
    "key": "restaurant-open-orders",
    "fn": "restaurantOpenOrders",
    "view": "restaurant",
    "kind": "open-orders",
    "title": "Open Orders",
    "args": [
      "tableId"
    ],
    "edit": null,
    "params": {
      "tableId": "scope"
    },
    "parent": {
      "view": "restaurant"
    },
    "read": false
  },
  {
    "key": "tables",
    "fn": "manageRestaurantTables",
    "view": "restaurantTables",
    "kind": "manage",
    "title": "Restaurant Tables",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "restaurantTables"
    },
    "read": false
  },
  {
    "key": "images",
    "fn": "psProductImagesV366",
    "view": "psFinished",
    "kind": "images",
    "title": "Product Images",
    "args": [
      "productId"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psFinished"
    },
    "read": true
  },
  {
    "key": "commerce-product",
    "fn": "psCommerceProductV365",
    "view": "psCommerce",
    "kind": "product",
    "title": "Commerce Product",
    "args": [
      "productId"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psCommerce"
    },
    "read": true
  },
  {
    "key": "commerce-mapping",
    "fn": "psCommerceConfigureMappingV365",
    "view": "psCommerce",
    "kind": "mapping",
    "title": "Channel Mapping",
    "args": [
      "productId",
      "channelId"
    ],
    "edit": null,
    "params": {
      "channelId": "scope"
    },
    "parent": {
      "view": "psCommerce"
    },
    "read": true
  },
  {
    "key": "addresses",
    "fn": "psCustomerAddressesV366",
    "view": "psCustomers",
    "kind": "addresses",
    "title": "Customer Addresses",
    "args": [
      "customerId"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psCustomers",
      "kind": "customer",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "customer-address",
    "fn": "psCustomerAddressFormV367",
    "view": "psCustomers",
    "kind": "address-new",
    "title": "Customer Address",
    "args": [
      "customerId",
      "id"
    ],
    "edit": "address-edit",
    "params": {
      "customerId": "scope"
    },
    "parent": {
      "view": "psCustomers",
      "kind": "customer",
      "idFrom": "scope",
      "section": ""
    },
    "read": false
  },
  {
    "key": "locations",
    "fn": "psLocationsV366",
    "view": "psRawStock",
    "kind": "locations",
    "title": "Locations",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psRawStock"
    },
    "read": false
  },
  {
    "key": "price-lists",
    "fn": "psPriceListsV366",
    "view": "psSales",
    "kind": "price-lists",
    "title": "Price Lists",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psSales"
    },
    "read": false
  },
  {
    "key": "price-tiers",
    "fn": "psPriceTiers313",
    "view": "psCustomers",
    "kind": "price-tiers",
    "title": "Price Tiers",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psCustomers"
    },
    "read": false
  },
  {
    "key": "document-history",
    "fn": "documentHistoryV3241",
    "view": "documents",
    "kind": "history",
    "title": "Document History",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "documents"
    },
    "read": true
  },
  {
    "key": "system-integrity",
    "fn": "showIntegrity",
    "view": "systemSettings",
    "kind": "integrity",
    "title": "Cross-module Data Integrity",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "systemSettings"
    },
    "read": false
  },
  {
    "key": "accounting-integrity",
    "fn": "accountingIntegrityV29",
    "view": "accounting",
    "kind": "integrity",
    "title": "Accounting Integrity",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "accounting"
    },
    "read": false
  },
  {
    "key": "trace-raw",
    "fn": "psTraceRaw",
    "view": "psRawStock",
    "kind": "trace",
    "title": "Traceability",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psRawStock"
    },
    "read": true
  },
  {
    "key": "trace-product",
    "fn": "psTraceProduct",
    "view": "psFinished",
    "kind": "trace",
    "title": "Traceability",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psFinished"
    },
    "read": true
  },
  {
    "key": "calendar",
    "fn": "meetingCalendarView",
    "view": "meetings",
    "kind": "calendar",
    "title": "Meeting Calendar",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "meetings"
    },
    "read": false
  },
  {
    "key": "cost-register",
    "fn": "excavatorCosts",
    "view": "excavator",
    "kind": "costs",
    "title": "Excavator Costs & Logistics",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "excavator",
      "kind": "machine",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "customer-statement",
    "fn": "psStatement313",
    "view": "psCustomers",
    "kind": "statement",
    "title": "Customer Statement",
    "args": [
      "customerId"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psCustomers",
      "kind": "customer",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "supplier-statement",
    "fn": "psSupplierStatement315",
    "view": "psSuppliers",
    "kind": "statement",
    "title": "Supplier Statement",
    "args": [
      "sid"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psSuppliers",
      "kind": "supplier",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "waste",
    "fn": "psWasteForm",
    "view": "psWaste",
    "kind": "new",
    "title": "Waste & Loss",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psWaste"
    },
    "read": false
  },
  {
    "key": "legacy-profile",
    "fn": "v340EditProfile",
    "view": "users",
    "kind": "profile-edit",
    "title": "Edit Profile",
    "args": [
      "key"
    ],
    "edit": null,
    "params": {
      "key": "filter"
    },
    "parent": {
      "view": "users",
      "kind": "profiles"
    },
    "read": false,
    "stringArgs": [
      "key"
    ],
    "wrapForm": true
  },
  {
    "key": "payroll-item",
    "fn": "editPayrollItemV359",
    "view": "payroll",
    "kind": "adjust-item",
    "title": "Review / Adjust",
    "args": [
      "runId",
      "itemId"
    ],
    "edit": null,
    "params": {
      "runId": "scope"
    },
    "parent": {
      "view": "payroll",
      "kind": "run",
      "idFrom": "scope",
      "section": ""
    },
    "read": true
  },
  {
    "key": "approval-request",
    "fn": "approvalForm",
    "view": "approvals",
    "kind": "new",
    "title": "Approval Request",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "approvals"
    },
    "read": false
  },
  {
    "key": "approval-resubmit",
    "fn": "approvalResubmitForm",
    "view": "approvals",
    "kind": "resubmit",
    "title": "Correct & Resubmit Approval Request",
    "args": [
      "id",
      "taskId"
    ],
    "edit": null,
    "params": {
      "taskId": "scope"
    },
    "parent": {
      "view": "approvals",
      "kind": "approval",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "crm-new",
    "fn": "crmForm",
    "view": "crm",
    "kind": "new",
    "title": "Lead / customer",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "crm"
    },
    "read": false
  },
  {
    "key": "crm-edit",
    "fn": "crmEdit",
    "view": "crm",
    "kind": "edit",
    "title": "Edit CRM record",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "crm"
    },
    "read": true
  },
  {
    "key": "report-action",
    "fn": "reportActionForm",
    "view": "reports",
    "kind": "action",
    "title": "Take Action from Report",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "reports",
      "kind": "report",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "report-rule",
    "fn": "reportRuleForm",
    "view": "reports",
    "kind": "rule-new",
    "title": "Reporting Rule",
    "args": [
      "id"
    ],
    "edit": "rule-edit",
    "params": {},
    "parent": {
      "view": "reports"
    },
    "read": false
  },
  {
    "key": "performance-rule",
    "fn": "performanceRuleForm",
    "view": "performance",
    "kind": "rule-new",
    "title": "Performance KPI Rule",
    "args": [
      "id"
    ],
    "edit": "rule-edit",
    "params": {},
    "parent": {
      "view": "performance"
    },
    "read": false
  },
  {
    "key": "kpi-new",
    "fn": "kpiForm",
    "view": "performance",
    "kind": "kpi-new",
    "title": "Add KPI",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "performance"
    },
    "read": false
  },
  {
    "key": "kpi-edit",
    "fn": "kpiEdit",
    "view": "performance",
    "kind": "kpi-edit",
    "title": "Edit KPI",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "performance"
    },
    "read": true
  },
  {
    "key": "document-upload",
    "fn": "docForm",
    "view": "documents",
    "kind": "new",
    "title": "Upload document",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "documents"
    },
    "read": false
  },
  {
    "key": "meeting-action",
    "fn": "meetingAction",
    "view": "meetings",
    "kind": "action-new",
    "title": "Meeting Action / Follow-up",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "meetings",
      "kind": "meeting",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "meeting-agenda",
    "fn": "v362AgendaForm",
    "view": "meetings",
    "kind": "agenda-new",
    "title": "Add Agenda Item",
    "args": [
      "meetingId"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "meetings",
      "kind": "meeting",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "user-edit",
    "fn": "userEdit",
    "view": "users",
    "kind": "identity-edit",
    "title": "Edit User",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "users",
      "kind": "access",
      "idFrom": "id",
      "section": ""
    },
    "read": true
  },
  {
    "key": "weekly-edit",
    "fn": "weeklyForm",
    "view": "restaurant",
    "kind": "weekly-new",
    "title": "Weekly Menu",
    "args": [
      "id"
    ],
    "edit": "weekly-edit",
    "params": {},
    "parent": {
      "view": "restaurant",
      "kind": "weekly"
    },
    "read": false
  },
  {
    "key": "repair",
    "fn": "excavatorRepairForm",
    "view": "excavator",
    "kind": "repair-new",
    "title": "Add Repair",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "excavator",
      "kind": "machine",
      "idFrom": "id",
      "section": "costs"
    },
    "read": true
  },
  {
    "key": "logistics",
    "fn": "excavatorLogisticsForm",
    "view": "excavator",
    "kind": "logistics-new",
    "title": "Add Logistics / Shipping",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "excavator",
      "kind": "machine",
      "idFrom": "id",
      "section": "costs"
    },
    "read": true
  },
  {
    "key": "channel-new",
    "fn": "psCommerceAddChannelV365",
    "view": "psCommerce",
    "kind": "channel-new",
    "title": "Add Commerce Channel",
    "args": [],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psCommerce"
    },
    "read": false
  },
  {
    "key": "channel-edit",
    "fn": "psCommerceEditChannelV365",
    "view": "psCommerce",
    "kind": "channel-edit",
    "title": "Edit Commerce Channel",
    "args": [
      "id"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psCommerce"
    },
    "read": true
  },
  {
    "key": "location-edit",
    "fn": "psLocationFormV366",
    "view": "psRawStock",
    "kind": "location-new",
    "title": "Location",
    "args": [
      "id"
    ],
    "edit": "location-edit",
    "params": {},
    "parent": {
      "view": "psRawStock",
      "kind": "locations"
    },
    "read": false
  },
  {
    "key": "business-unit",
    "fn": "v319BusinessUnitForm",
    "view": "systemSettings",
    "kind": "unit-new",
    "title": "Business Unit",
    "args": [
      "id"
    ],
    "edit": "unit-edit",
    "params": {},
    "parent": {
      "view": "systemSettings",
      "section": "business_units"
    },
    "read": false
  },
  {
    "key": "pricing-hierarchy",
    "fn": "psPricingHierarchyV367",
    "view": "psFinished",
    "kind": "pricing",
    "title": "Pricing Hierarchy",
    "args": [
      "productId"
    ],
    "edit": null,
    "params": {},
    "parent": {
      "view": "psFinished"
    },
    "read": true
  }
];
const byKey=new Map(catalogue.map(c=>[c.key,c]));const current=()=>{const r=window.BOMRouter?.parse();return {r,c:catalogue.find(c=>c.view===r?.view&&(c.kind===r.kind||c.edit===r.kind))}};
function argsFor(c,r){return c.args.map(a=>c.params[a]?r.params.get(c.params[a])||(a==='type'?'Daily':0):r.id||0)}
function navigate(key,args=[]){const c=byKey.get(key),params={};if(!c)throw Error('Unknown workflow');let id=0;for(let i=0;i<c.args.length;i++){const a=c.args[i],v=args[i];if(c.params[a])params[c.params[a]]=v??(a==='type'?'Daily':0);else id=Number(v||0)}return BOMRouter.navigate(c.view,c.edit&&id?c.edit:c.kind,id,'',{params})}
function render(key,html,className='wide'){const c=byKey.get(key),options=typeof className==='object'?{...className}:{className};options.className='bom-editor-page '+(options.className||'');const result=openWorkflowHtmlV324(html,options),surface=document.getElementById('v324WorkflowSurface');if(!surface)return result;surface.dataset.bomWorkflow=key;if(c.wrapForm&&!surface.querySelector('form')){const f=document.createElement('form');f.dataset.bomNoReview='1';f.addEventListener('submit',e=>e.preventDefault());while(surface.firstChild)f.appendChild(surface.firstChild);f.querySelectorAll('button').forEach(b=>b.type='button');surface.append(f)}surface.querySelectorAll('form').forEach(f=>f.classList.add('bom-editor-form'));surface.querySelectorAll('button').forEach(b=>{if(['Cancel','Close','Back','취소','닫기','뒤로','✕','×'].includes(b.textContent.trim())&&!b.closest('.field')){b.type='button';b.setAttribute('onclick','closeWorkflowPageV324()');if(['✕','×'].includes(b.textContent.trim()))b.classList.add('v324-hide-page-x')}});BOMUI?.decorate(surface);return result}
async function returnToOrigin(){const {r,c}=current();if(!c)return false;const previous=history.state?.previousRoute,prior=previous?BOMRouter.parse(previous):null;formDirty=false;if(prior&&BOMRoutes.views().has(prior.view)&&previous!==location.hash){await BOMRouter.navigate(prior.view,prior.kind,prior.id,prior.section,{unit:prior.unit,params:Object.fromEntries(prior.params),replace:true});return true}const p=c.parent,id=p.idFrom==='id'?r.id:p.idFrom?Number(r.params.get(p.idFrom)||0):Number(p.id||0);await BOMRouter.navigate(p.view,p.kind||'',id,p.section||'',{replace:true});return true}
async function finish(keys){const {c}=current();return c&&(Array.isArray(keys)?keys:[keys]).includes(c.key)?returnToOrigin():false}function committed(keys){const {c}=current();if(c&&(Array.isArray(keys)?keys:[keys]).includes(c.key))formDirty=false}
function cartFilter(){const unit=document.getElementById('purUnit')?.value;document.querySelectorAll('#purProduct option[data-unit]').forEach(o=>o.hidden=o.dataset.unit!==unit)}function cartTotals(kind){const items=kind==='sale'?window._saleItems:window._purItems,field=kind==='sale'?'unit_price':'unit_cost',el=document.getElementById('bom-cart-'+kind+'-subtotal');if(el)el.textContent='₩ '+money((items||[]).reduce((s,l)=>s+Number(l.quantity||0)*Number(l[field]||0),0))}
const open={};for(const c of catalogue){open[c.key]=async()=>{const r=BOMRouter.parse();for(const [a,q] of Object.entries(c.params))if(a!=='type'&&!(c.stringArgs||[]).includes(a)&&!(Number(r.params.get(q))>0)&&!['tableId','taskId'].includes(a))throw Object.assign(new Error('Invalid parent record'),{status:400});const fn=window[c.fn];if(typeof fn!=='function')throw Object.assign(new Error('Workflow unavailable'),{status:503});const result=await fn(...argsFor(c,r));if(document.getElementById('v324WorkflowSurface')?.dataset.bomWorkflow!==c.key)throw Object.assign(new Error('Workflow unavailable'),{status:BOMRouter.diagnostics().error_status||(c.key==='task'?403:c.read?404:503)});return result};for(const [kind,noId] of [[c.kind,!c.read],[c.edit,false]])if(kind)BOMRoutes.record(c.view,kind,['BOMWorkflowPages42.open.'+c.key],null,{noId,parent:c.parent,workflowPage:true})}
window.BOMWorkflowPages42=Object.freeze({version:'30.69.42',catalogue,open,navigate,render,finish,committed,current,returnToOrigin,cartTotals,cartFilter});})();
