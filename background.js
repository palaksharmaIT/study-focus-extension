importScripts("config.js");

// ==============================
// WEBSITE BLOCKING RULES
// (unchanged from before)
// ==============================

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


// ==============================
// FOCUS SESSION TIMER
// ==============================
// NEW: this used to live entirely inside popup.js as a
// setInterval(). Chrome unloads the popup's whole script the
// moment it closes, so the "timer" actually stopped the instant
// the user clicked away — it only looked like it was running.
//
// The fix: the service worker is the source of truth. We store
// an absolute "focusEndTime" timestamp and schedule a single
// chrome.alarms alarm to fire exactly then. That alarm fires
// even if the popup has been closed the whole time. popup.js
// only reads/display the remaining time when it happens to be
// open — it no longer owns the countdown.

const FOCUS_ALARM_NAME = "focusSessionComplete";


// Start a brand new countdown of `durationMinutes` minutes
async function startFocusTimer(durationMinutes) {

    const endTime = Date.now() + durationMinutes * 60 * 1000;

    await chrome.storage.local.set({
        focusEndTime: endTime,
        sessionRunning: true,
        sessionCompleted: false
    });

    chrome.alarms.create(FOCUS_ALARM_NAME, { when: endTime });
}


// Pause: freeze the remaining time and cancel the alarm
async function pauseFocusTimer() {

    const data = await chrome.storage.local.get(["focusEndTime"]);

    const remainingMs = data.focusEndTime
        ? data.focusEndTime - Date.now()
        : 0;

    await chrome.storage.local.set({
        remainingSeconds: Math.max(0, Math.round(remainingMs / 1000)),
        sessionRunning: false
    });

    chrome.alarms.clear(FOCUS_ALARM_NAME);
}


// Resume: pick up where it left off, from `remainingSeconds`
async function resumeFocusTimer(remainingSeconds) {

    const endTime = Date.now() + remainingSeconds * 1000;

    await chrome.storage.local.set({
        focusEndTime: endTime,
        sessionRunning: true
    });

    chrome.alarms.create(FOCUS_ALARM_NAME, { when: endTime });
}


// Fired by the alarm when the countdown reaches zero —
// runs regardless of whether the popup is open
async function completeFocusSessionInBackground() {

    await chrome.storage.local.set({
        sessionRunning: false,
        sessionCompleted: true,
        remainingSeconds: 0
    });

    chrome.alarms.clear(FOCUS_ALARM_NAME);

    // Tell the backend the session finished, so
    // FocusSession.completed / end_time actually get set
    const data = await chrome.storage.local.get([
        "accessToken",
        "sessionId"
    ]);

    if (data.accessToken && data.sessionId) {

        try {
            await fetch(
                `${API_BASE_URL}/api/focus/${data.sessionId}/complete/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${data.accessToken}`
                    }
                }
            );

        } catch (error) {
            console.error(
                "Could not mark session complete on server:",
                error
            );
        }
    }
}


chrome.alarms.onAlarm.addListener((alarm) => {

    if (alarm.name === FOCUS_ALARM_NAME) {
        completeFocusSessionInBackground();
    }

});


// popup.js talks to the timer through these messages instead
// of running its own setInterval
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "START_FOCUS_TIMER") {
        startFocusTimer(message.durationMinutes)
            .then(() => sendResponse({ ok: true }));
        return true; // keep the message channel open for the async response
    }

    if (message.type === "PAUSE_FOCUS_TIMER") {
        pauseFocusTimer()
            .then(() => sendResponse({ ok: true }));
        return true;
    }

    if (message.type === "RESUME_FOCUS_TIMER") {
        resumeFocusTimer(message.remainingSeconds)
            .then(() => sendResponse({ ok: true }));
        return true;
    }

});