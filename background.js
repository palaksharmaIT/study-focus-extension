async function updateBlockingRules() {
    const data = await chrome.storage.local.get([
        "studyMode",
        "blockedWebsites"
    ]);

    const studyMode = data.studyMode || false;
    const websites = data.blockedWebsites || [];

    // Get existing rules
    const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();

    const removeRuleIds = existingRules.map(rule => rule.id);

    // Remove old rules
    if (removeRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: removeRuleIds
        });
    }

    // If Study Mode is OFF, don't add blocking rules
    if (!studyMode) {
        return;
    }

    // Create redirect rules
    const addRules = websites.map((website, index) => ({
        id: index + 1,

        priority: 1,

        action: {
            type: "redirect",

            redirect: {
                extensionPath: "/blocked.html"
            }
        },

        condition: {
            urlFilter: `||${website}^`,

            resourceTypes: [
                "main_frame"
            ]
        }
    }));

    // Add new rules
    if (addRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: addRules
        });
    }
}


// Extension installed
chrome.runtime.onInstalled.addListener(() => {
    updateBlockingRules();
});


// Browser started
chrome.runtime.onStartup.addListener(() => {
    updateBlockingRules();
});


// Settings changed
chrome.storage.onChanged.addListener((changes) => {

    if (changes.studyMode || changes.blockedWebsites) {
        updateBlockingRules();
    }

});