// const studyModeToggle = document.getElementById("study-mode");
// const modeStatus = document.getElementById("mode-status");

// const websiteInput = document.getElementById("website-input");
// const addWebsiteButton = document.getElementById("add-website");
// const websiteList = document.getElementById("website-list");

// const blockedCount = document.getElementById("blocked-count");
// const sessionStatus = document.getElementById("session-status");

// const loginButton = document.getElementById("login-button");
// const logoutButton = document.getElementById("logout-button");
// const userNameLabel = document.getElementById("user-email");

// const authPrompt = document.getElementById("auth-prompt");
// const appContent = document.getElementById("app-content");


// // Default blocked websites
// const defaultBlockedWebsites = [
//     "youtube.com",
//     "instagram.com",
//     "facebook.com",
//     "reddit.com",
//     "netflix.com",
//     "x.com"
// ];


// // Check login state first, THEN decide what to show
// document.addEventListener("DOMContentLoaded", checkAuthAndLoad);


// // Study Mode toggle
// studyModeToggle.addEventListener("change", async () => {

//     const isEnabled = studyModeToggle.checked;

//     await chrome.storage.local.set({
//         studyMode: isEnabled
//     });

//     updateModeUI(isEnabled);
// });


// // Add website button
// addWebsiteButton.addEventListener("click", addWebsite);


// // Press Enter to add website
// websiteInput.addEventListener("keydown", (event) => {

//     if (event.key === "Enter") {
//         addWebsite();
//     }

// });


// // Login / Register button
// loginButton.addEventListener("click", () => {

//     chrome.tabs.create({
//         url: chrome.runtime.getURL("login.html")
//     });

// });


// // Logout button
// if (logoutButton) {

//     logoutButton.addEventListener("click", async () => {

//         await chrome.storage.local.remove([
//             "accessToken",
//             "userName"
//         ]);

//         showAuthPrompt();

//     });

// }


// // Decide which screen to show: login prompt, or the main app
// async function checkAuthAndLoad() {

//     const data = await chrome.storage.local.get([
//         "accessToken",
//         "userName"
//     ]);

//     if (data.accessToken) {

//         showAppContent(data.userName);
//         loadSettings();

//     } else {

//         showAuthPrompt();

//     }

// }


// function showAuthPrompt() {

//     authPrompt.classList.remove("hidden");
//     appContent.classList.add("hidden");

// }


// function showAppContent(username) {

//     authPrompt.classList.add("hidden");
//     appContent.classList.remove("hidden");

//     if (userNameLabel) {
//         userNameLabel.textContent = username || "";
//     }

// }


// // Load saved settings
// async function loadSettings() {
//     const data = await chrome.storage.local.get([
//         "studyMode",
//         "accessToken"
//     ]);

//     const studyMode = data.studyMode || false;
//     const accessToken = data.accessToken;

//     if (!accessToken) {
//         alert("Please login first.");
//         return;
//     }

//     try {
//         const response = await fetch(
//             "http://127.0.0.1:8000/api/websites/",
//             {
//                 method: "GET",
//                 headers: {
//                     "Authorization": `Bearer ${accessToken}`
//                 }
//             }
//         );

//         if (response.status === 401) {
//             alert("Session expired. Please login again.");

//             await chrome.storage.local.remove([
//                 "accessToken",
//                 "refreshToken"
//             ]);

//             return;
//         }

//         if (!response.ok) {
//             throw new Error(
//                 `Server returned ${response.status}`
//             );
//         }

//         const apiData = await response.json();

//         console.log("Websites received from Django:", apiData);

//         // Get only the domain names
//         const websites = apiData
//             .filter(item => item.is_active)
//             .map(item => item.domain);

//         // Save the latest Django list locally
//         await chrome.storage.local.set({
//             blockedWebsites: websites
//         });

//         // Update popup
//         displayWebsites(websites);

//     } catch (error) {
//         console.error("Could not load websites:", error);

//         // If API fails, show locally saved websites
//         const localData = await chrome.storage.local.get(
//             "blockedWebsites"
//         );

//         displayWebsites(
//             localData.blockedWebsites || []
//         );
//     }

//     studyModeToggle.checked = studyMode;
//     updateModeUI(studyMode);
// }


// // Update Study Mode UI
// function updateModeUI(isEnabled) {

//     if (isEnabled) {

//         modeStatus.textContent = "Currently ON";
//         sessionStatus.textContent = "Active";

//     } else {

//         modeStatus.textContent = "Currently OFF";
//         sessionStatus.textContent = "Inactive";

//     }

// }


// // Add a website
// async function addWebsite() {
//     let website = websiteInput.value.trim().toLowerCase();

//     if (!website) {
//         return;
//     }

//     // Remove http:// or https://
//     website = website.replace(/^https?:\/\//, "");

//     // Remove www.
//     website = website.replace(/^www\./, "");

//     // Remove everything after /
//     website = website.split("/")[0];

//     try {
//         const tokenData = await chrome.storage.local.get(
//             "accessToken"
//         );

//         const accessToken = tokenData.accessToken;

//         if (!accessToken) {
//             alert("Please login first.");
//             return;
//         }

//         const response = await fetch(
//             "http://127.0.0.1:8000/api/websites/add/",
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "Authorization": `Bearer ${accessToken}`
//                 },
//                 body: JSON.stringify({
//                     domain: website
//                 })
//             }
//         );

//         const data = await response.json();

//         if (!response.ok) {
//             alert(data.error || "Could not add website.");
//             return;
//         }

//         // Save the updated list locally
//         const storageData = await chrome.storage.local.get(
//             "blockedWebsites"
//         );

//         const websites = storageData.blockedWebsites || [];

//         if (!websites.includes(data.domain)) {
//             websites.push(data.domain);
//         }

//         await chrome.storage.local.set({
//             blockedWebsites: websites
//         });

//         websiteInput.value = "";

//         displayWebsites(websites);

//     } catch (error) {
//         console.error("Add website error:", error);

//         alert("Could not connect to Django server.");
//     }
// }
// // Remove website
// async function removeWebsite(index) {

//     const data = await chrome.storage.local.get(
//         "blockedWebsites"
//     );

//     const websites = data.blockedWebsites || [];


//     websites.splice(index, 1);


//     await chrome.storage.local.set({
//         blockedWebsites: websites
//     });


//     displayWebsites(websites);
// }

// function displayWebsites(websites) {
//     websiteList.innerHTML = "";

//     blockedCount.textContent = websites.length;

//     if (websites.length === 0) {
//         websiteList.innerHTML = `
//             <li class="empty-message">
//                 No blocked websites
//             </li>
//         `;
//         return;
//     }

//     websites.forEach((website, index) => {
//         const li = document.createElement("li");

//         li.innerHTML = `
//             <span>${website}</span>
//             <button data-index="${index}">
//                 Remove
//             </button>
//         `;

//         const removeButton = li.querySelector("button");

//         removeButton.addEventListener("click", () => {
//             removeWebsite(index);
//         });

//         websiteList.appendChild(li);
//     });
// }

const API_BASE_URL = "https://studyfocus-backend.onrender.com";

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


// Check login state first
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


// Logout
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        await chrome.storage.local.remove([
            "accessToken",
            "refreshToken",
            "userName"
        ]);

        showAuthPrompt();
    });
}


// Check authentication
async function checkAuthAndLoad() {

    const data = await chrome.storage.local.get([
        "accessToken",
        "userName"
    ]);

    if (data.accessToken) {

        showAppContent(data.userName);

        await loadSettings();

    } else {

        showAuthPrompt();
    }
}


// Show login screen
function showAuthPrompt() {

    authPrompt.classList.remove("hidden");
    appContent.classList.add("hidden");
}


// Show application
function showAppContent(username) {

    authPrompt.classList.add("hidden");
    appContent.classList.remove("hidden");

    if (userNameLabel) {
        userNameLabel.textContent = username || "";
    }
}


// Load websites from Django
async function loadSettings() {

    const data = await chrome.storage.local.get([
        "studyMode",
        "accessToken"
    ]);

    const studyMode = data.studyMode || false;
    const accessToken = data.accessToken;

    if (!accessToken) {
        alert("Please login first.");
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/websites/`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`
                }
            }
        );

        if (response.status === 401) {

            alert("Session expired. Please login again.");

            await chrome.storage.local.remove([
                "accessToken",
                "refreshToken",
                "userName"
            ]);

            showAuthPrompt();

            return;
        }

        if (!response.ok) {
            throw new Error(
                `Server returned ${response.status}`
            );
        }

        const apiData = await response.json();

        console.log(
            "Websites received from Django:",
            apiData
        );

        const websites = apiData
            .filter(item => item.is_active)
            .map(item => item.domain);

        await chrome.storage.local.set({
            blockedWebsites: websites
        });

        displayWebsites(websites);

    } catch (error) {

        console.error(
            "Could not load websites:",
            error
        );

        const localData =
            await chrome.storage.local.get(
                "blockedWebsites"
            );

        displayWebsites(
            localData.blockedWebsites || []
        );
    }

    studyModeToggle.checked = studyMode;

    updateModeUI(studyMode);
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


// Add website
async function addWebsite() {

    let website =
        websiteInput.value.trim().toLowerCase();

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

        const tokenData =
            await chrome.storage.local.get(
                "accessToken"
            );

        const accessToken =
            tokenData.accessToken;


        if (!accessToken) {

            alert("Please login first.");
            return;
        }


        const response = await fetch(
            `${API_BASE_URL}/api/websites/add/`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },

                body: JSON.stringify({
                    domain: website
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            alert(
                data.error ||
                "Could not add website."
            );

            return;
        }


        const storageData =
            await chrome.storage.local.get(
                "blockedWebsites"
            );


        const websites =
            storageData.blockedWebsites || [];


        if (!websites.includes(data.domain)) {

            websites.push(data.domain);
        }


        await chrome.storage.local.set({
            blockedWebsites: websites
        });


        websiteInput.value = "";

        displayWebsites(websites);


    } catch (error) {

        console.error(
            "Add website error:",
            error
        );

        alert(
            "Could not connect to Django server."
        );
    }
}


// Remove website
async function removeWebsite(index) {

    const data =
        await chrome.storage.local.get(
            "blockedWebsites"
        );

    const websites =
        data.blockedWebsites || [];


    websites.splice(index, 1);


    await chrome.storage.local.set({
        blockedWebsites: websites
    });


    displayWebsites(websites);
}


// Display websites
function displayWebsites(websites) {

    websiteList.innerHTML = "";

    blockedCount.textContent =
        websites.length;


    if (websites.length === 0) {

        websiteList.innerHTML = `
            <li class="empty-message">
                No blocked websites
            </li>
        `;

        return;
    }


    websites.forEach((website, index) => {

        const li =
            document.createElement("li");


        const domainText =
            document.createElement("span");

        domainText.textContent =
            website;


        const removeButton =
            document.createElement("button");

        removeButton.textContent =
            "Remove";


        removeButton.addEventListener(
            "click",
            () => {
                removeWebsite(index);
            }
        );


        li.appendChild(domainText);
        li.appendChild(removeButton);


        websiteList.appendChild(li);
    });
}
