// V30.16 access hotfix preload.
// V30.16 access overlay runs in strict mode and assigns several new global handlers.
// Declare them before v316-client.js loads so the assignments do not throw ReferenceError.
var userAccessOpen,
    applyAccessTemplate,
    copyAccessDialog,
    copyAccessNow,
    saveAccessAssignments,
    saveAccessPermissions,
    saveAccessSpecial,
    saveAccessLimits;
