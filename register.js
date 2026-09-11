const registerForm = document.getElementById("register-form");
const errorMessage = document.getElementById("error-message");
const successMessage = document.getElementById("success-message");

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
        const response = await fetch(
            "http://127.0.0.1:8000/api/auth/register/",
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
            if (typeof data === "object") {
                const errors = Object.values(data).flat();
                errorMessage.textContent = errors.join(" ");
            } else {
                errorMessage.textContent =
                    "Registration failed.";
            }

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