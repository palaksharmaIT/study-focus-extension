// // const studyModeToggle = document.getElementById("study-mode");
// // const modeStatus = document.getElementById("mode-status");

// // const websiteInput = document.getElementById("website-input");
// // const addWebsiteButton = document.getElementById("add-website");
// // const websiteList = document.getElementById("website-list");

// // const blockedCount = document.getElementById("blocked-count");
// // const sessionStatus = document.getElementById("session-status");

// // const loginButton = document.getElementById("login-button");
// // const logoutButton = document.getElementById("logout-button");
// // const userNameLabel = document.getElementById("user-email");

// // const authPrompt = document.getElementById("auth-prompt");
// // const appContent = document.getElementById("app-content");


// // // Default blocked websites
// // const defaultBlockedWebsites = [
// //     "youtube.com",
// //     "instagram.com",
// //     "facebook.com",
// //     "reddit.com",
// //     "netflix.com",
// //     "x.com"
// // ];


// // // Check login state first, THEN decide what to show
// // document.addEventListener("DOMContentLoaded", checkAuthAndLoad);


// // // Study Mode toggle
// // studyModeToggle.addEventListener("change", async () => {

// //     const isEnabled = studyModeToggle.checked;

// //     await chrome.storage.local.set({
// //         studyMode: isEnabled
// //     });

// //     updateModeUI(isEnabled);
// // });


// // // Add website button
// // addWebsiteButton.addEventListener("click", addWebsite);


// // // Press Enter to add website
// // websiteInput.addEventListener("keydown", (event) => {

// //     if (event.key === "Enter") {
// //         addWebsite();
// //     }

// // });


// // // Login / Register button
// // loginButton.addEventListener("click", () => {

// //     chrome.tabs.create({
// //         url: chrome.runtime.getURL("login.html")
// //     });

// // });


// // // Logout button
// // if (logoutButton) {

// //     logoutButton.addEventListener("click", async () => {

// //         await chrome.storage.local.remove([
// //             "accessToken",
// //             "userName"
// //         ]);

// //         showAuthPrompt();

// //     });

// // }


// // // Decide which screen to show: login prompt, or the main app
// // async function checkAuthAndLoad() {

// //     const data = await chrome.storage.local.get([
// //         "accessToken",
// //         "userName"
// //     ]);

// //     if (data.accessToken) {

// //         showAppContent(data.userName);
// //         loadSettings();

// //     } else {

// //         showAuthPrompt();

// //     }

// // }


// // function showAuthPrompt() {

// //     authPrompt.classList.remove("hidden");
// //     appContent.classList.add("hidden");

// // }


// // function showAppContent(username) {

// //     authPrompt.classList.add("hidden");
// //     appContent.classList.remove("hidden");

// //     if (userNameLabel) {
// //         userNameLabel.textContent = username || "";
// //     }

// // }


// // // Load saved settings
// // async function loadSettings() {
// //     const data = await chrome.storage.local.get([
// //         "studyMode",
// //         "accessToken"
// //     ]);

// //     const studyMode = data.studyMode || false;
// //     const accessToken = data.accessToken;

// //     if (!accessToken) {
// //         alert("Please login first.");
// //         return;
// //     }

// //     try {
// //         const response = await fetch(
// //             "http://127.0.0.1:8000/api/websites/",
// //             {
// //                 method: "GET",
// //                 headers: {
// //                     "Authorization": `Bearer ${accessToken}`
// //                 }
// //             }
// //         );

// //         if (response.status === 401) {
// //             alert("Session expired. Please login again.");

// //             await chrome.storage.local.remove([
// //                 "accessToken",
// //                 "refreshToken"
// //             ]);

// //             return;
// //         }

// //         if (!response.ok) {
// //             throw new Error(
// //                 `Server returned ${response.status}`
// //             );
// //         }

// //         const apiData = await response.json();

// //         console.log("Websites received from Django:", apiData);

// //         // Get only the domain names
// //         const websites = apiData
// //             .filter(item => item.is_active)
// //             .map(item => item.domain);

// //         // Save the latest Django list locally
// //         await chrome.storage.local.set({
// //             blockedWebsites: websites
// //         });

// //         // Update popup
// //         displayWebsites(websites);

// //     } catch (error) {
// //         console.error("Could not load websites:", error);

// //         // If API fails, show locally saved websites
// //         const localData = await chrome.storage.local.get(
// //             "blockedWebsites"
// //         );

// //         displayWebsites(
// //             localData.blockedWebsites || []
// //         );
// //     }

// //     studyModeToggle.checked = studyMode;
// //     updateModeUI(studyMode);
// // }


// // // Update Study Mode UI
// // function updateModeUI(isEnabled) {

// //     if (isEnabled) {

// //         modeStatus.textContent = "Currently ON";
// //         sessionStatus.textContent = "Active";

// //     } else {

// //         modeStatus.textContent = "Currently OFF";
// //         sessionStatus.textContent = "Inactive";

// //     }

// // }


// // // Add a website
// // async function addWebsite() {
// //     let website = websiteInput.value.trim().toLowerCase();

// //     if (!website) {
// //         return;
// //     }

// //     // Remove http:// or https://
// //     website = website.replace(/^https?:\/\//, "");

// //     // Remove www.
// //     website = website.replace(/^www\./, "");

// //     // Remove everything after /
// //     website = website.split("/")[0];

// //     try {
// //         const tokenData = await chrome.storage.local.get(
// //             "accessToken"
// //         );

// //         const accessToken = tokenData.accessToken;

// //         if (!accessToken) {
// //             alert("Please login first.");
// //             return;
// //         }

// //         const response = await fetch(
// //             "http://127.0.0.1:8000/api/websites/add/",
// //             {
// //                 method: "POST",
// //                 headers: {
// //                     "Content-Type": "application/json",
// //                     "Authorization": `Bearer ${accessToken}`
// //                 },
// //                 body: JSON.stringify({
// //                     domain: website
// //                 })
// //             }
// //         );

// //         const data = await response.json();

// //         if (!response.ok) {
// //             alert(data.error || "Could not add website.");
// //             return;
// //         }

// //         // Save the updated list locally
// //         const storageData = await chrome.storage.local.get(
// //             "blockedWebsites"
// //         );

// //         const websites = storageData.blockedWebsites || [];

// //         if (!websites.includes(data.domain)) {
// //             websites.push(data.domain);
// //         }

// //         await chrome.storage.local.set({
// //             blockedWebsites: websites
// //         });

// //         websiteInput.value = "";

// //         displayWebsites(websites);

// //     } catch (error) {
// //         console.error("Add website error:", error);

// //         alert("Could not connect to Django server.");
// //     }
// // }
// // // Remove website
// // async function removeWebsite(index) {

// //     const data = await chrome.storage.local.get(
// //         "blockedWebsites"
// //     );

// //     const websites = data.blockedWebsites || [];


// //     websites.splice(index, 1);


// //     await chrome.storage.local.set({
// //         blockedWebsites: websites
// //     });


// //     displayWebsites(websites);
// // }

// // function displayWebsites(websites) {
// //     websiteList.innerHTML = "";

// //     blockedCount.textContent = websites.length;

// //     if (websites.length === 0) {
// //         websiteList.innerHTML = `
// //             <li class="empty-message">
// //                 No blocked websites
// //             </li>
// //         `;
// //         return;
// //     }

// //     websites.forEach((website, index) => {
// //         const li = document.createElement("li");

// //         li.innerHTML = `
// //             <span>${website}</span>
// //             <button data-index="${index}">
// //                 Remove
// //             </button>
// //         `;

// //         const removeButton = li.querySelector("button");

// //         removeButton.addEventListener("click", () => {
// //             removeWebsite(index);
// //         });

// //         websiteList.appendChild(li);
// //     });
// // }

// const API_BASE_URL = "https://studyfocus-backend.onrender.com";

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


// // Check login state first
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


// // Logout
// if (logoutButton) {
//     logoutButton.addEventListener("click", async () => {
//         await chrome.storage.local.remove([
//             "accessToken",
//             "refreshToken",
//             "userName"
//         ]);

//         showAuthPrompt();
//     });
// }


// // Check authentication
// async function checkAuthAndLoad() {

//     const data = await chrome.storage.local.get([
//         "accessToken",
//         "userName"
//     ]);

//     if (data.accessToken) {

//         showAppContent(data.userName);

//         await loadSettings();

//     } else {

//         showAuthPrompt();
//     }
// }


// // Show login screen
// function showAuthPrompt() {

//     authPrompt.classList.remove("hidden");
//     appContent.classList.add("hidden");
// }


// // Show application
// function showAppContent(username) {

//     authPrompt.classList.add("hidden");
//     appContent.classList.remove("hidden");

//     if (userNameLabel) {
//         userNameLabel.textContent = username || "";
//     }
// }


// // Load websites from Django
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
//             `${API_BASE_URL}/api/websites/`,
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
//                 "refreshToken",
//                 "userName"
//             ]);

//             showAuthPrompt();

//             return;
//         }

//         if (!response.ok) {
//             throw new Error(
//                 `Server returned ${response.status}`
//             );
//         }

//         const apiData = await response.json();

//         console.log(
//             "Websites received from Django:",
//             apiData
//         );

//         const websites = apiData
//             .filter(item => item.is_active)
//             .map(item => item.domain);

//         await chrome.storage.local.set({
//             blockedWebsites: websites
//         });

//         displayWebsites(websites);

//     } catch (error) {

//         console.error(
//             "Could not load websites:",
//             error
//         );

//         const localData =
//             await chrome.storage.local.get(
//                 "blockedWebsites"
//             );

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


// // Add website
// async function addWebsite() {

//     let website =
//         websiteInput.value.trim().toLowerCase();

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

//         const tokenData =
//             await chrome.storage.local.get(
//                 "accessToken"
//             );

//         const accessToken =
//             tokenData.accessToken;


//         if (!accessToken) {

//             alert("Please login first.");
//             return;
//         }


//         const response = await fetch(
//             `${API_BASE_URL}/api/websites/add/`,
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

//             alert(
//                 data.error ||
//                 "Could not add website."
//             );

//             return;
//         }


//         const storageData =
//             await chrome.storage.local.get(
//                 "blockedWebsites"
//             );


//         const websites =
//             storageData.blockedWebsites || [];


//         if (!websites.includes(data.domain)) {

//             websites.push(data.domain);
//         }


//         await chrome.storage.local.set({
//             blockedWebsites: websites
//         });


//         websiteInput.value = "";

//         displayWebsites(websites);


//     } catch (error) {

//         console.error(
//             "Add website error:",
//             error
//         );

//         alert(
//             "Could not connect to Django server."
//         );
//     }
// }


// // Remove website
// async function removeWebsite(index) {

//     const data =
//         await chrome.storage.local.get(
//             "blockedWebsites"
//         );

//     const websites =
//         data.blockedWebsites || [];


//     websites.splice(index, 1);


//     await chrome.storage.local.set({
//         blockedWebsites: websites
//     });


//     displayWebsites(websites);
// }


// // Display websites
// function displayWebsites(websites) {

//     websiteList.innerHTML = "";

//     blockedCount.textContent =
//         websites.length;


//     if (websites.length === 0) {

//         websiteList.innerHTML = `
//             <li class="empty-message">
//                 No blocked websites
//             </li>
//         `;

//         return;
//     }


//     websites.forEach((website, index) => {

//         const li =
//             document.createElement("li");


//         const domainText =
//             document.createElement("span");

//         domainText.textContent =
//             website;


//         const removeButton =
//             document.createElement("button");

//         removeButton.textContent =
//             "Remove";


//         removeButton.addEventListener(
//             "click",
//             () => {
//                 removeWebsite(index);
//             }
//         );


//         li.appendChild(domainText);
//         li.appendChild(removeButton);


//         websiteList.appendChild(li);
//     });
// }

const API_BASE_URL = "http://127.0.0.1:8000";

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
// FOCUS SESSION VARIABLES
// ==============================

let selectedDuration = 25;

let timerInterval = null;

let remainingSeconds = 0;

let sessionRunning = false;

let sessionId = null;


// ==============================
// PAGE LOAD
// ==============================

document.addEventListener(
    "DOMContentLoaded",
    checkAuthAndLoad
);


// ==============================
// STUDY MODE TOGGLE
// ==============================

studyModeToggle.addEventListener(
    "change",
    async () => {

        const isEnabled =
            studyModeToggle.checked;


        await chrome.storage.local.set({
            studyMode: isEnabled
        });


        // Study Mode turned ON
        if (isEnabled) {

            updateModeUI(true);

            // Resume existing session
            const sessionData =
                await chrome.storage.local.get([
                    "remainingSeconds",
                    "sessionRunning",
                    "selectedDuration"
                ]);


            if (
                sessionData.sessionRunning &&
                sessionData.remainingSeconds > 0
            ) {

                remainingSeconds =
                    sessionData.remainingSeconds;

                selectedDuration =
                    sessionData.selectedDuration || 25;

                sessionRunning = true;

                startTimer();

            }

        }

        // Study Mode turned OFF
        else {

            updateModeUI(false);

            pauseTimer();

        }

    }
);


// ==============================
// DURATION BUTTONS
// ==============================

durationButtons.forEach(button => {

    button.addEventListener(
        "click",
        async () => {

            // Don't allow changing duration
            // while session is running
            if (sessionRunning) {
                return;
            }


            durationButtons.forEach(btn => {

                btn.classList.remove("active");

            });


            button.classList.add("active");


            selectedDuration =
                Number(button.dataset.duration);


            remainingSeconds =
                selectedDuration * 60;


            await chrome.storage.local.set({
                selectedDuration:
                    selectedDuration,

                remainingSeconds:
                    remainingSeconds
            });


            updateTimerDisplay(
                remainingSeconds
            );

        }
    );

});


// ==============================
// START SESSION
// ==============================

startSessionButton.addEventListener(
    "click",
    startFocusSession
);


async function startFocusSession() {

    // Study Mode must be ON
    if (!studyModeToggle.checked) {

        alert(
            "Turn ON Study Mode before starting a focus session."
        );

        return;
    }


    // Don't start another session
    if (sessionRunning) {
        return;
    }


    try {

        const tokenData =
            await chrome.storage.local.get(
                "accessToken"
            );


        const accessToken =
            tokenData.accessToken;


        if (!accessToken) {

            alert(
                "Please login first."
            );

            return;
        }


        // If there is an existing paused session,
        // resume it instead of creating a new one
        const savedSession =
            await chrome.storage.local.get([
                "sessionId",
                "remainingSeconds",
                "selectedDuration",
                "sessionRunning"
            ]);


        if (
            savedSession.sessionId &&
            savedSession.remainingSeconds > 0
        ) {

            sessionId =
                savedSession.sessionId;

            selectedDuration =
                savedSession.selectedDuration || 25;

            remainingSeconds =
                savedSession.remainingSeconds;

            sessionRunning = true;

            startTimer();

            return;
        }


        // New session
        const response = await fetch(
            `${API_BASE_URL}/api/focus/start/`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${accessToken}`
                },

                body: JSON.stringify({
                    duration:
                        selectedDuration
                })
            }
        );


        const data =
            await response.json();


        if (response.status === 401) {

            alert(
                "Session expired. Please login again."
            );


            await chrome.storage.local.remove([
                "accessToken",
                "refreshToken",
                "userName"
            ]);


            showAuthPrompt();

            return;
        }


        if (!response.ok) {

            alert(
                data.error ||
                "Could not start focus session."
            );

            return;
        }


        // Save backend session ID
        sessionId = data.id;


        remainingSeconds =
            selectedDuration * 60;


        sessionRunning = true;


        await chrome.storage.local.set({

            sessionId:
                sessionId,

            selectedDuration:
                selectedDuration,

            remainingSeconds:
                remainingSeconds,

            sessionRunning:
                true

        });


        startTimer();


    } 
    
    catch (error) {

        console.error(
            "Start session error:",
            error
        );

        alert(
            "Start Session Error: " + error.message
        );

    }

}


// ==============================
// START TIMER
// ==============================

function startTimer() {

    if (timerInterval) {
        return;
    }


    sessionRunning = true;


    startSessionButton.textContent =
        "Session Running";


    sessionStatus.textContent =
        "Active";


    updateTimerDisplay(
        remainingSeconds
    );


    timerInterval = setInterval(
        async () => {

            // Safety check:
            // if Study Mode is OFF,
            // pause the timer
            if (!studyModeToggle.checked) {

                pauseTimer();

                return;
            }


            remainingSeconds--;


            updateTimerDisplay(
                remainingSeconds
            );


            await chrome.storage.local.set({

                remainingSeconds:
                    remainingSeconds,

                sessionRunning:
                    true

            });


            // Timer finished
            if (remainingSeconds <= 0) {

                await completeSession();

            }

        },
        1000
    );

}


// ==============================
// PAUSE TIMER
// ==============================

async function pauseTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }


    if (!sessionRunning) {
        return;
    }


    sessionRunning = true;


    startSessionButton.textContent =
        "Resume Session";


    sessionStatus.textContent =
        "Paused";


    await chrome.storage.local.set({

        remainingSeconds:
            remainingSeconds,

        sessionRunning:
            true

    });

}


// ==============================
// COMPLETE SESSION
// ==============================

async function completeSession() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }


    remainingSeconds = 0;

    sessionRunning = false;


    updateTimerDisplay(0);


    startSessionButton.textContent =
        "Session Completed";


    sessionStatus.textContent =
        "Completed";


    await chrome.storage.local.set({

        remainingSeconds:
            0,

        sessionRunning:
            false,

        sessionCompleted:
            true

    });


    alert(
        "Focus session completed!"
    );

}


// ==============================
// UPDATE TIMER DISPLAY
// ==============================

function updateTimerDisplay(seconds) {

    const minutes =
        Math.floor(seconds / 60);


    const remaining =
        seconds % 60;


    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;

}


// ==============================
// ADD WEBSITE
// ==============================

addWebsiteButton.addEventListener(
    "click",
    addWebsite
);


// Press Enter to add website
websiteInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            addWebsite();

        }

    }
);


// ==============================
// LOGIN / REGISTER
// ==============================

loginButton.addEventListener(
    "click",
    () => {

        chrome.tabs.create({

            url:
                chrome.runtime.getURL(
                    "login.html"
                )

        });

    }
);


// ==============================
// LOGOUT
// ==============================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            // Stop timer if running
            if (timerInterval) {

                clearInterval(
                    timerInterval
                );

                timerInterval = null;

            }


            await chrome.storage.local.remove([

                "accessToken",

                "refreshToken",

                "userName",

                "sessionId",

                "remainingSeconds",

                "sessionRunning",

                "sessionCompleted"

            ]);


            showAuthPrompt();

        }
    );

}


// ==============================
// CHECK AUTHENTICATION
// ==============================

async function checkAuthAndLoad() {

    const data =
        await chrome.storage.local.get([

            "accessToken",

            "userName"

        ]);


    if (data.accessToken) {

        showAppContent(
            data.userName
        );


        await loadSettings();


        await loadFocusSession();

    }

    else {

        showAuthPrompt();

    }

}


// ==============================
// SHOW LOGIN SCREEN
// ==============================

function showAuthPrompt() {

    authPrompt.classList.remove(
        "hidden"
    );

    appContent.classList.add(
        "hidden"
    );

}


// ==============================
// SHOW APPLICATION
// ==============================

function showAppContent(username) {

    authPrompt.classList.add(
        "hidden"
    );

    appContent.classList.remove(
        "hidden"
    );


    if (userNameLabel) {

        userNameLabel.textContent =
            username || "";

    }

}


// ==============================
// LOAD WEBSITES FROM DJANGO
// ==============================

async function loadSettings() {

    const data =
        await chrome.storage.local.get([

            "studyMode",

            "accessToken"

        ]);


    const studyMode =
        data.studyMode || false;


    const accessToken =
        data.accessToken;


    if (!accessToken) {

        alert(
            "Please login first."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/api/websites/`,
                {

                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${accessToken}`

                    }

                }
            );


        if (response.status === 401) {

            alert(
                "Session expired. Please login again."
            );


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


        const apiData =
            await response.json();


        console.log(
            "Websites received from Django:",
            apiData
        );


        const websites =
            apiData

                .filter(
                    item => item.is_active
                )

                .map(
                    item => item.domain
                );


        await chrome.storage.local.set({

            blockedWebsites:
                websites

        });


        displayWebsites(
            websites
        );


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


    studyModeToggle.checked =
        studyMode;


    updateModeUI(
        studyMode
    );

}


// ==============================
// LOAD FOCUS SESSION
// ==============================

async function loadFocusSession() {

    const data =
        await chrome.storage.local.get([

            "selectedDuration",

            "remainingSeconds",

            "sessionRunning",

            "sessionCompleted",

            "sessionId"

        ]);


    if (data.selectedDuration) {

        selectedDuration =
            data.selectedDuration;

    }


    if (
        typeof data.remainingSeconds ===
        "number"
    ) {

        remainingSeconds =
            data.remainingSeconds;

    }

    else {

        remainingSeconds =
            selectedDuration * 60;

    }


    sessionId =
        data.sessionId || null;


    updateTimerDisplay(
        remainingSeconds
    );


    // Completed session
    if (data.sessionCompleted) {

        sessionRunning = false;

        sessionStatus.textContent =
            "Completed";

        startSessionButton.textContent =
            "Session Completed";

        return;

    }


    // Paused/running session
    if (
        data.sessionRunning &&
        remainingSeconds > 0
    ) {

        sessionRunning = true;


        if (studyModeToggle.checked) {

            startTimer();

        }

        else {

            startSessionButton.textContent =
                "Resume Session";

            sessionStatus.textContent =
                "Paused";

        }

    }

}


// ==============================
// UPDATE STUDY MODE UI
// ==============================

function updateModeUI(isEnabled) {

    if (isEnabled) {

        modeStatus.textContent =
            "Currently ON";


        // If a session is running,
        // show Active
        if (sessionRunning) {

            sessionStatus.textContent =
                "Active";

        }

        else if (remainingSeconds > 0) {

            sessionStatus.textContent =
                "Paused";

        }

        else {

            sessionStatus.textContent =
                "Inactive";

        }

    }

    else {

        modeStatus.textContent =
            "Currently OFF";


        if (sessionRunning) {

            sessionStatus.textContent =
                "Paused";

        }

        else {

            sessionStatus.textContent =
                "Inactive";

        }

    }

}


// ==============================
// ADD WEBSITE
// ==============================

async function addWebsite() {

    let website =
        websiteInput.value
            .trim()
            .toLowerCase();


    if (!website) {

        return;

    }


    // Remove http:// or https://
    website =
        website.replace(
            /^https?:\/\//,
            ""
        );


    // Remove www.
    website =
        website.replace(
            /^www\./,
            ""
        );


    // Remove everything after /
    website =
        website.split("/")[0];


    try {

        const tokenData =
            await chrome.storage.local.get(
                "accessToken"
            );


        const accessToken =
            tokenData.accessToken;


        if (!accessToken) {

            alert(
                "Please login first."
            );

            return;

        }


        const response =
            await fetch(
                `${API_BASE_URL}/api/websites/add/`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${accessToken}`

                    },

                    body: JSON.stringify({

                        domain:
                            website

                    })

                }
            );


        const data =
            await response.json();


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


        if (
            !websites.includes(
                data.domain
            )
        ) {

            websites.push(
                data.domain
            );

        }


        await chrome.storage.local.set({

            blockedWebsites:
                websites

        });


        websiteInput.value = "";


        displayWebsites(
            websites
        );


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


// ==============================
// REMOVE WEBSITE
// ==============================

async function removeWebsite(index) {

    const data =
        await chrome.storage.local.get(
            "blockedWebsites"
        );


    const websites =
        data.blockedWebsites || [];


    websites.splice(
        index,
        1
    );


    await chrome.storage.local.set({

        blockedWebsites:
            websites

    });


    displayWebsites(
        websites
    );

}


// ==============================
// DISPLAY WEBSITES
// ==============================

function displayWebsites(websites) {

    websiteList.innerHTML = "";


    blockedCount.textContent =
        websites.length;


    if (websites.length === 0) {

        const emptyMessage =
            document.createElement("li");


        emptyMessage.className =
            "empty-message";


        emptyMessage.textContent =
            "No blocked websites";


        websiteList.appendChild(
            emptyMessage
        );


        return;

    }


    websites.forEach(
        (website, index) => {

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

                    removeWebsite(
                        index
                    );

                }
            );


            li.appendChild(
                domainText
            );


            li.appendChild(
                removeButton
            );


            websiteList.appendChild(
                li
            );

        }
    );

}


