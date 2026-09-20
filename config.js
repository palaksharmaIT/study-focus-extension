
//   const API_BASE_URL = "http://127.0.0.1:8000";

const API_BASE_URL = "https://studyfocus-backend.onrender.com";




// Usage: apiFetch("/api/websites/", { method: "GET" })

async function apiFetch(path, options = {}) {

    const tokenData = await chrome.storage.local.get([
        "accessToken",
        "refreshToken"
    ]);

    const doFetch = (accessToken) => {

        const headers = {
            ...(options.headers || {})
        };

        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }

        return fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers
        });
    };

    let response = await doFetch(tokenData.accessToken);

    if (response.status !== 401) {
        return response;
    }

    // Access token expired (or missing) — try to refresh it
    if (!tokenData.refreshToken) {
        return response;
    }

    try {

        const refreshResponse = await fetch(
            `${API_BASE_URL}/api/auth/refresh/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refresh: tokenData.refreshToken
                })
            }
        );

        if (!refreshResponse.ok) {

            // Refresh token is also invalid/expired — force logout
            await chrome.storage.local.remove([
                "accessToken",
                "refreshToken",
                "userName"
            ]);

            return response;
        }

        const refreshData = await refreshResponse.json();

        await chrome.storage.local.set({
            accessToken: refreshData.access
        });

        // Retry the original request with the new token
        response = await doFetch(refreshData.access);

        return response;

    } catch (error) {

        console.error("Token refresh failed:", error);
        return response;
    }
}