const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    errorMessage.textContent = "";

    if (!username || !password) {
        errorMessage.textContent =
            "Please enter username and password.";
        return;
    }

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/api/auth/login/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            errorMessage.textContent =
                "Invalid username or password.";
            return;
        }

        console.log("Login successful");
        console.log("Access token received");
        console.log("Refresh token received");

        await chrome.storage.local.set({
            accessToken: data.access,
            refreshToken: data.refresh,
            userName: username
        });

        errorMessage.textContent = "";

        const successMessage = document.getElementById("success-message");
        if (successMessage) {
            successMessage.textContent = "Login successful! Closing this tab...";
        }

        // The extension popup can't be force-opened from a regular tab
        // (Chrome blocks that for security), so we close this tab instead.
        // Next time the user clicks the extension icon, checkAuthAndLoad()
        // in popup.js will see the saved token and show the dashboard.
        setTimeout(() => {
            window.close();
        }, 1200);

    } catch (error) {
        console.error("Login error:", error);

        errorMessage.textContent =
            "Could not connect to the server.";
    }
});