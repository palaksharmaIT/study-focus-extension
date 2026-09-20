// ==============================
// DOM ELEMENTS
// ==============================

const studyModeToggle = document.getElementById("study-mode");
const modeStatus = document.getElementById("mode-status");

const websiteInput = document.getElementById("website-input");
const addWebsiteButton = document.getElementById("add-website");
const websiteList = document.getElementById("website-list");
const blockedCount = document.getElementById("blocked-count");

const sessionStatus = document.getElementById("session-status");

const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");

const userNameLabel = document.getElementById("user-email");

const authPrompt = document.getElementById("auth-prompt");
const appContent = document.getElementById("app-content");

// Focus Session elements
const timerDisplay = document.getElementById("timer");
const durationButtons = document.querySelectorAll(".duration-btn");
const startSessionButton = document.getElementById("start-session");


// ==============================
// FOCUS SESSION STATE
// ==============================
// NOTE: the actual countdown now lives in background.js (via
// chrome.alarms), so it survives the popup being closed. These
// variables here are only for driving the popup's own display
// while it happens to be open — they are not the source of truth.

let selectedDuration = 25;
let remainingSeconds = 0;
let focusEndTime = null;
let sessionRunning = false;
let sessionId = null;
let uiTickInterval = null;


// ==============================
// PAGE LOAD
// ==============================

document.addEventListener("DOMContentLoaded", checkAuthAndLoad);


// ==============================
// STUDY MODE TOGGLE
// ==============================

studyModeToggle.addEventListener("change", async () => {

    const isEnabled = studyModeToggle.checked;

    await chrome.storage.local.set({
        studyMode: isEnabled
    });

    updateModeUI(isEnabled);

    // Study Mode turned OFF while a session is running -> pause it
    if (!isEnabled && sessionRunning) {

        sessionRunning = false;
        stopUiTicking();

        await chrome.runtime.sendMessage({
            type: "PAUSE_FOCUS_TIMER"
        });

        startSessionButton.textContent = "Resume Session";
        sessionStatus.textContent = "Paused";
    }
});


// ==============================
// DURATION BUTTONS
// ==============================

durationButtons.forEach(button => {

    button.addEventListener("click", async () => {

        // Don't allow changing duration while a session is running
        if (sessionRunning) {
            return;
        }

        durationButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        selectedDuration = Number(button.dataset.duration);
        remainingSeconds = selectedDuration * 60;

        await chrome.storage.local.set({
            selectedDuration: selectedDuration,
            remainingSeconds: remainingSeconds
        });

        updateTimerDisplay(remainingSeconds);
    });
});


// ==============================
// START / RESUME SESSION
// ==============================

startSessionButton.addEventListener("click", startFocusSession);


async function startFocusSession() {

    if (!studyModeToggle.checked) {
        alert("Turn ON Study Mode before starting a focus session.");
        return;
    }

    if (sessionRunning) {
        return;
    }

    const tokenData = await chrome.storage.local.get("accessToken");

    if (!tokenData.accessToken) {
        alert("Please login first.");
        return;
    }

    // If there's an existing paused session, resume it
    const saved = await chrome.storage.local.get([
        "sessionId",
        "remainingSeconds",
        "selectedDuration",
        "sessionRunning",
        "sessionCompleted"
    ]);

    const hasPausedSession =
        saved.sessionId &&
        saved.remainingSeconds > 0 &&
        !saved.sessionRunning &&
        !saved.sessionCompleted;

    if (hasPausedSession) {

        sessionId = saved.sessionId;
        selectedDuration = saved.selectedDuration || 25;
        remainingSeconds = saved.remainingSeconds;
        sessionRunning = true;

        await chrome.runtime.sendMessage({
            type: "RESUME_FOCUS_TIMER",
            remainingSeconds: remainingSeconds
        });

        focusEndTime = Date.now() + remainingSeconds * 1000;
        startUiTicking();
        return;
    }

    // Otherwise, start a brand new session on the backend
    try {

        const response = await apiFetch("/api/focus/start/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                duration: selectedDuration
            })
        });

        const data = await response.json();

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            await logoutAndShowAuthPrompt();
            return;
        }

        if (!response.ok) {
            alert(data.error || "Could not start focus session.");
            return;
        }

        sessionId = data.id;
        remainingSeconds = selectedDuration * 60;
        sessionRunning = true;
        focusEndTime = Date.now() + remainingSeconds * 1000;

        await chrome.storage.local.set({
            sessionId: sessionId,
            selectedDuration: selectedDuration
        });

        await chrome.runtime.sendMessage({
            type: "START_FOCUS_TIMER",
            durationMinutes: selectedDuration
        });

        startUiTicking();

    } catch (error) {
        console.error("Start session error:", error);
        alert("Start Session Error: " + error.message);
    }
}


// ==============================
// UI TICKING (display only)
// ==============================
// This interval only refreshes what's shown in the popup. The
// real countdown (and what happens when it hits zero) is owned
// by background.js, so closing the popup no longer stops the
// session — it just stops updating this number.

function startUiTicking() {

    if (uiTickInterval) {
        return;
    }

    sessionRunning = true;

    startSessionButton.textContent = "Session Running";
    sessionStatus.textContent = "Active";

    updateTimerDisplay(remainingSeconds);

    uiTickInterval = setInterval(() => {

        remainingSeconds = Math.max(
            0,
            Math.round((focusEndTime - Date.now()) / 1000)
        );

        updateTimerDisplay(remainingSeconds);

        if (remainingSeconds <= 0) {
            stopUiTicking();
            showSessionCompletedUI();
        }

    }, 1000);
}


function stopUiTicking() {

    if (uiTickInterval) {
        clearInterval(uiTickInterval);
        uiTickInterval = null;
    }
}


function showSessionCompletedUI() {

    sessionRunning = false;
    remainingSeconds = 0;

    updateTimerDisplay(0);

    startSessionButton.textContent = "Session Completed";
    sessionStatus.textContent = "Completed";

    alert("Focus session completed!");
}


// ==============================
// UPDATE TIMER DISPLAY
// ==============================

function updateTimerDisplay(seconds) {

    const minutes = Math.floor(seconds / 60);
    const remaining = seconds % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}


// ==============================
// ADD WEBSITE
// ==============================

addWebsiteButton.addEventListener("click", addWebsite);

websiteInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addWebsite();
    }
});


// ==============================
// LOGIN / REGISTER
// ==============================

loginButton.addEventListener("click", () => {
    chrome.tabs.create({
        url: chrome.runtime.getURL("login.html")
    });
});


// ==============================
// LOGOUT
// ==============================

if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        stopUiTicking();

        // Also stop the background timer and clear its alarm so
        // a stale session doesn't keep counting down for a user
        // who just logged out
        chrome.alarms.clear("focusSessionComplete");

        await chrome.storage.local.remove([
            "accessToken",
            "refreshToken",
            "userName",
            "sessionId",
            "remainingSeconds",
            "sessionRunning",
            "sessionCompleted",
            "focusEndTime"
        ]);

        showAuthPrompt();
    });
}


async function logoutAndShowAuthPrompt() {

    stopUiTicking();

    await chrome.storage.local.remove([
        "accessToken",
        "refreshToken",
        "userName"
    ]);

    showAuthPrompt();
}


// ==============================
// CHECK AUTHENTICATION
// ==============================

async function checkAuthAndLoad() {

    const data = await chrome.storage.local.get([
        "accessToken",
        "userName"
    ]);

    if (data.accessToken) {

        showAppContent(data.userName);

        await loadSettings();
        await loadFocusSession();

    } else {

        showAuthPrompt();
    }
}


function showAuthPrompt() {
    authPrompt.classList.remove("hidden");
    appContent.classList.add("hidden");
}


function showAppContent(username) {

    authPrompt.classList.add("hidden");
    appContent.classList.remove("hidden");

    if (userNameLabel) {
        userNameLabel.textContent = username || "";
    }
}


// ==============================
// LOAD WEBSITES FROM DJANGO
// ==============================

async function loadSettings() {

    const data = await chrome.storage.local.get([
        "studyMode",
        "accessToken"
    ]);

    const studyMode = data.studyMode || false;

    if (!data.accessToken) {
        alert("Please login first.");
        return;
    }

    try {

        const response = await apiFetch("/api/websites/", {
            method: "GET"
        });

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            await logoutAndShowAuthPrompt();
            return;
        }

        if (!response.ok) {
            throw new Error(`Server returned ${response.status}`);
        }

        const apiData = await response.json();

        const websites = apiData
            .filter(item => item.is_active)
            .map(item => item.domain);

        await chrome.storage.local.set({
            blockedWebsites: websites
        });

        displayWebsites(websites);

    } catch (error) {

        console.error("Could not load websites:", error);

        const localData = await chrome.storage.local.get("blockedWebsites");
        displayWebsites(localData.blockedWebsites || []);
    }

    studyModeToggle.checked = studyMode;
    updateModeUI(studyMode);
}


// ==============================
// LOAD FOCUS SESSION
// ==============================
// Reads the state background.js has been keeping in storage and
// re-syncs this popup's display to it. Handles four cases:
// completed, still running (resume ticking), paused, or fresh.

async function loadFocusSession() {

    const data = await chrome.storage.local.get([
        "selectedDuration",
        "remainingSeconds",
        "sessionRunning",
        "sessionCompleted",
        "sessionId",
        "focusEndTime"
    ]);

    if (data.selectedDuration) {
        selectedDuration = data.selectedDuration;
    }

    sessionId = data.sessionId || null;

    // Completed while popup was closed
    if (data.sessionCompleted) {

        sessionRunning = false;
        remainingSeconds = 0;

        updateTimerDisplay(0);

        sessionStatus.textContent = "Completed";
        startSessionButton.textContent = "Session Completed";

        return;
    }

    // Still running in the background
    if (data.sessionRunning && data.focusEndTime) {

        const remaining = Math.max(
            0,
            Math.round((data.focusEndTime - Date.now()) / 1000)
        );

        if (remaining <= 0) {
            // Alarm hasn't fired yet but time is technically up —
            // show it as completing momentarily
            showSessionCompletedUI();
            return;
        }

        remainingSeconds = remaining;
        focusEndTime = data.focusEndTime;

        updateTimerDisplay(remainingSeconds);

        if (studyModeToggle.checked) {
            startUiTicking();
        } else {
            // Study Mode is off but a session is still marked as
            // running in storage — bring the background timer in
            // sync by pausing it too
            sessionRunning = false;

            await chrome.runtime.sendMessage({
                type: "PAUSE_FOCUS_TIMER"
            });

            startSessionButton.textContent = "Resume Session";
            sessionStatus.textContent = "Paused";
        }

        return;
    }

    // Paused, with time left
    if (typeof data.remainingSeconds === "number" && data.remainingSeconds > 0) {

        sessionRunning = false;
        remainingSeconds = data.remainingSeconds;

        updateTimerDisplay(remainingSeconds);

        startSessionButton.textContent = "Resume Session";
        sessionStatus.textContent = "Paused";

        return;
    }

    // Fresh state — nothing started yet
    remainingSeconds = selectedDuration * 60;
    updateTimerDisplay(remainingSeconds);
}


// ==============================
// UPDATE STUDY MODE UI
// ==============================

function updateModeUI(isEnabled) {

    if (isEnabled) {

        modeStatus.textContent = "Currently ON";

        if (sessionRunning) {
            sessionStatus.textContent = "Active";
        } else if (remainingSeconds > 0) {
            sessionStatus.textContent = "Paused";
        } else {
            sessionStatus.textContent = "Inactive";
        }

    } else {

        modeStatus.textContent = "Currently OFF";
        sessionStatus.textContent = sessionRunning ? "Paused" : "Inactive";
    }
}


// ==============================
// ADD WEBSITE
// ==============================

async function addWebsite() {

    let website = websiteInput.value.trim().toLowerCase();

    if (!website) {
        return;
    }

    // Remove http:// or https://
    website = website.replace(/^https?:\/\//, "");

    // Remove www.
    website = website.replace(/^www\./, "");

    // Remove everything after /
    website = website.split("/")[0];

    try {

        const tokenData = await chrome.storage.local.get("accessToken");

        if (!tokenData.accessToken) {
            alert("Please login first.");
            return;
        }

        const response = await apiFetch("/api/websites/add/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ domain: website })
        });

        const data = await response.json();

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            await logoutAndShowAuthPrompt();
            return;
        }

        if (!response.ok) {
            alert(data.error || "Could not add website.");
            return;
        }

        const storageData = await chrome.storage.local.get("blockedWebsites");
        const websites = storageData.blockedWebsites || [];

        if (!websites.includes(data.domain)) {
            websites.push(data.domain);
        }

        await chrome.storage.local.set({ blockedWebsites: websites });

        websiteInput.value = "";

        displayWebsites(websites);

    } catch (error) {
        console.error("Add website error:", error);
        alert("Could not connect to the server.");
    }
}


// ==============================
// REMOVE WEBSITE
// ==============================
// NEW: this now actually calls the backend to deactivate the
// domain. Before, this only touched local storage, so the
// website came right back on the next sync from Django.

async function removeWebsite(index) {

    const data = await chrome.storage.local.get("blockedWebsites");
    const websites = data.blockedWebsites || [];

    const domain = websites[index];

    if (!domain) {
        return;
    }

    try {

        const response = await apiFetch("/api/websites/remove/", {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ domain: domain })
        });

        if (response.status === 401) {
            alert("Session expired. Please login again.");
            await logoutAndShowAuthPrompt();
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            alert(errorData.error || "Could not remove website.");
            return;
        }

        websites.splice(index, 1);

        await chrome.storage.local.set({ blockedWebsites: websites });

        displayWebsites(websites);

    } catch (error) {
        console.error("Remove website error:", error);
        alert("Could not connect to the server.");
    }
}


// ==============================
// DISPLAY WEBSITES
// ==============================

function displayWebsites(websites) {

    websiteList.innerHTML = "";
    blockedCount.textContent = websites.length;

    if (websites.length === 0) {

        const emptyMessage = document.createElement("li");
        emptyMessage.className = "empty-message";
        emptyMessage.textContent = "No blocked websites";

        websiteList.appendChild(emptyMessage);
        return;
    }

    websites.forEach((website, index) => {

        const li = document.createElement("li");

        const domainText = document.createElement("span");
        domainText.textContent = website;

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", () => {
            removeWebsite(index);
        });

        li.appendChild(domainText);
        li.appendChild(removeButton);

        websiteList.appendChild(li);
    });
}