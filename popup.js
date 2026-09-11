const studyModeToggle = document.getElementById("study-mode");
const modeStatus = document.getElementById("mode-status");

const websiteInput = document.getElementById("website-input");
const addWebsiteButton = document.getElementById("add-website");
const websiteList = document.getElementById("website-list");

const blockedCount = document.getElementById("blocked-count");
const sessionStatus = document.getElementById("session-status");

const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const userEmailLabel = document.getElementById("user-email");

const authPrompt = document.getElementById("auth-prompt");
const appContent = document.getElementById("app-content");


// Default blocked websites
const defaultBlockedWebsites = [
    "youtube.com",
    "instagram.com",
    "facebook.com",
    "reddit.com",
    "netflix.com",
    "x.com"
];


// Check login state first, THEN decide what to show
document.addEventListener("DOMContentLoaded", checkAuthAndLoad);


// Study Mode toggle
studyModeToggle.addEventListener("change", async () => {

    const isEnabled = studyModeToggle.checked;

    await chrome.storage.local.set({
        studyMode: isEnabled
    });

    updateModeUI(isEnabled);
});


// Add website button
addWebsiteButton.addEventListener("click", addWebsite);


// Press Enter to add website
websiteInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        addWebsite();
    }

});


// Login / Register button
loginButton.addEventListener("click", () => {

    chrome.tabs.create({
        url: chrome.runtime.getURL("login.html")
    });

});


// Logout button
if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        await chrome.storage.local.remove([
            "accessToken",
            "userEmail"
        ]);

        showAuthPrompt();

    });

}


// Decide which screen to show: login prompt, or the main app
async function checkAuthAndLoad() {

    const data = await chrome.storage.local.get([
        "accessToken",
        "userEmail"
    ]);

    if (data.accessToken) {

        showAppContent(data.userEmail);
        loadSettings();

    } else {

        showAuthPrompt();

    }

}


function showAuthPrompt() {

    authPrompt.classList.remove("hidden");
    appContent.classList.add("hidden");

}


function showAppContent(email) {

    authPrompt.classList.add("hidden");
    appContent.classList.remove("hidden");

    if (userEmailLabel) {
        userEmailLabel.textContent = email || "";
    }

}


// Load saved settings
async function loadSettings() {

    const data = await chrome.storage.local.get([
        "studyMode",
        "blockedWebsites"
    ]);

    const studyMode = data.studyMode || false;

    let websites = data.blockedWebsites || [];


    // Get blocked websites from Django API
    try {

        const tokenData = await chrome.storage.local.get([
            "accessToken"
        ]);

        const accessToken = tokenData.accessToken;


        if (accessToken) {

            const response = await fetch(
                "http://127.0.0.1:8000/api/websites/",
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                }
            );


            if (response.ok) {

                const apiData = await response.json();

                websites = apiData
                    .filter(item => item.is_active)
                    .map(item => item.domain);


                await chrome.storage.local.set({
                    blockedWebsites: websites
                });

            } else if (response.status === 401) {

                // Token expired/invalid — send the user back to login
                await chrome.storage.local.remove([
                    "accessToken",
                    "userEmail"
                ]);

                showAuthPrompt();

                return;

            }

        }

    } catch (error) {

        console.log(
            "Could not connect to Django API:",
            error
        );

    }


    studyModeToggle.checked = studyMode;

    updateModeUI(studyMode);

    displayWebsites(websites);
}


// Update Study Mode UI
function updateModeUI(isEnabled) {

    if (isEnabled) {

        modeStatus.textContent = "Currently ON";
        sessionStatus.textContent = "Active";

    } else {

        modeStatus.textContent = "Currently OFF";
        sessionStatus.textContent = "Inactive";

    }

}


// Add a website
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


    const data = await chrome.storage.local.get(
        "blockedWebsites"
    );

    const websites = data.blockedWebsites || [];


    // Check duplicate
    if (websites.includes(website)) {

        alert("This website is already blocked.");

        return;
    }


    websites.push(website);


    await chrome.storage.local.set({
        blockedWebsites: websites
    });


    websiteInput.value = "";

    displayWebsites(websites);
}


// Display blocked websites
function displayWebsites(websites) {

    websiteList.innerHTML = "";

    blockedCount.textContent = websites.length;


    if (websites.length === 0) {

        websiteList.innerHTML = `
            <li class="empty-message">
                No blocked websites
            </li>
        `;

        return;
    }


    websites.forEach((website, index) => {

        const li = document.createElement("li");


        li.innerHTML = `
            <span>${website}</span>
            <button data-index="${index}">
                Remove
            </button>
        `;


        const removeButton = li.querySelector("button");


        removeButton.addEventListener("click", () => {

            removeWebsite(index);

        });


        websiteList.appendChild(li);

    });

}


// Remove website
async function removeWebsite(index) {

    const data = await chrome.storage.local.get(
        "blockedWebsites"
    );

    const websites = data.blockedWebsites || [];


    websites.splice(index, 1);


    await chrome.storage.local.set({
        blockedWebsites: websites
    });


    displayWebsites(websites);
}