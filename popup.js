const studyModeToggle = document.getElementById("study-mode");
const modeStatus = document.getElementById("mode-status");

const websiteInput = document.getElementById("website-input");
const addWebsiteButton = document.getElementById("add-website");
const websiteList = document.getElementById("website-list");

const blockedCount = document.getElementById("blocked-count");
const sessionStatus = document.getElementById("session-status");


const defaultBlockedWebsites = [
    "youtube.com",
    "instagram.com",
    "facebook.com",
    "reddit.com",
    "netflix.com",
    "x.com"
];


// Load saved settings when popup opens
document.addEventListener("DOMContentLoaded", loadSettings);


// Toggle Study Mode
studyModeToggle.addEventListener("change", async () => {

    const isEnabled = studyModeToggle.checked;

    await chrome.storage.local.set({
        studyMode: isEnabled
    });

    updateModeUI(isEnabled);
});


// Add new website
addWebsiteButton.addEventListener("click", addWebsite);


// Allow pressing Enter to add website
websiteInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        addWebsite();
    }

});


async function loadSettings() {

    const data = await chrome.storage.local.get([
        "studyMode",
        "blockedWebsites"
    ]);

    const studyMode = data.studyMode || false;

    let websites = data.blockedWebsites;

    // First installation
    if (!websites) {

        websites = defaultBlockedWebsites;

        await chrome.storage.local.set({
            blockedWebsites: websites
        });
    }

    studyModeToggle.checked = studyMode;

    updateModeUI(studyMode);

    displayWebsites(websites);
}


function updateModeUI(isEnabled) {

    if (isEnabled) {

        modeStatus.textContent = "Currently ON";
        sessionStatus.textContent = "Active";

    } else {

        modeStatus.textContent = "Currently OFF";
        sessionStatus.textContent = "Inactive";
    }
}


async function addWebsite() {

    let website = websiteInput.value.trim().toLowerCase();

    if (!website) {
        return;
    }

    // Remove http:// or https://
    website = website.replace(/^https?:\/\//, "");

    // Remove www.
    website = website.replace(/^www\./, "");

    // Remove anything after /
    website = website.split("/")[0];


    const data = await chrome.storage.local.get("blockedWebsites");

    const websites = data.blockedWebsites || [];


    // Prevent duplicates
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
            <button data-index="${index}">Remove</button>
        `;


        const removeButton = li.querySelector("button");

        removeButton.addEventListener("click", () => {
            removeWebsite(index);
        });


        websiteList.appendChild(li);
    });
}


async function removeWebsite(index) {

    const data = await chrome.storage.local.get("blockedWebsites");

    const websites = data.blockedWebsites || [];


    websites.splice(index, 1);


    await chrome.storage.local.set({
        blockedWebsites: websites
    });


    displayWebsites(websites);
}