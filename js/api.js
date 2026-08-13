function getToken() {
    return sessionStorage.getItem("token");
}

async function apiRequest(endpoint, options = {}) {

    const headers = {
        ...(options.headers || {})
    };

    const token =
        getToken();

    if (token) {
        headers["Authorization"] =
            `Bearer ${token}`;
    }

    if (options.body &&
        !headers["Content-Type"]) {

        headers["Content-Type"] =
            "application/json";
    }

    showLoading();

    try {

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

        let result = null;

        const contentType =
            response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
            result = await response.json();
        }

        if (response.status === 401) {

            sessionStorage.clear();

            showToast(
                "Your session has expired. Please login again.",
                "warning"
            );

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1000);

            throw new Error("Unauthorized");
        }

        if (response.status === 403) {

            const message =
                result?.message ||
                result?.title ||
                "You are not authorized to perform this action.";

            showToast(message, "danger");

            throw new Error("Forbidden");
        }

        if (!response.ok) {

            const message =
                result?.message ||
                result?.title ||
                `API Error (${response.status})`;

            showToast(message, "danger");

            throw new Error(message);
        }

        return result;

    } catch (error) {

        if (error instanceof TypeError) {

            showToast(
                "Unable to connect to the API. Please check whether the backend is running.",
                "danger"
            );
        }

        throw error;

    } finally {

        hideLoading();
    }
}
