const registerForm = document.getElementById("register-form");
const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");


// ==============================
// NEW: robust error-message extraction
// ==============================
// The backend can return errors in different shapes depending on
// what failed (a flat DRF {"field": ["msg"]} dict, a wrapped
// {"success": false, "message": "...", "errors": {...}} shape,
// etc). This walks the whole structure and collects only the
// actual string messages, so the user never sees "[object Object]"
// or stray "false"/"true" values.

function extractErrorMessage(data) {

    if (!data || typeof data !== "object") {
        return "Registration failed.";
    }

    const messages = [];

    function collect(value) {

        if (Array.isArray(value)) {
            value.forEach(collect);
        } else if (value && typeof value === "object") {
            Object.values(value).forEach(collect);
        } else if (typeof value === "string" && value.trim()) {
            messages.push(value);
        }
    }

    collect(data);

    return messages.length > 0
        ? messages.join(" ")
        : "Registration failed.";
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
        document.getElementById("confirm-password").value;

    errorMessage.textContent = "";
    successMessage.textContent = "";

    if (!username || !email || !password || !confirmPassword) {
        errorMessage.textContent = "Please fill all fields.";
        return;
    }

    if (password.length < 8) {
        errorMessage.textContent =
            "Password must be at least 8 characters.";
        return;
    }

    if (password !== confirmPassword) {
        errorMessage.textContent =
            "Passwords do not match.";
        return;
    }

    try {
        // NEW: API_BASE_URL now comes from config.js instead of
        // being hardcoded to 127.0.0.1, so this works against the
        // deployed backend too.
        const response = await fetch(
            `${API_BASE_URL}/api/auth/register/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            // NEW: recursively pulls out only the actual string
            // messages from whatever shape the backend sent back
            // (nested objects, arrays, booleans, etc.), instead of
            // just Object.values().flat() — which only unwraps one
            // level and prints "[object Object]" for anything
            // nested deeper than that.
            errorMessage.textContent = extractErrorMessage(data);
            return;
        }

        successMessage.textContent =
            "Account created successfully. You can now login.";

        registerForm.reset();

    } catch (error) {
        console.error("Registration error:", error);

        errorMessage.textContent =
            "Could not connect to the server.";
    }
});