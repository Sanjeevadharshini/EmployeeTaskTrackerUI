function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem("user") || "null");
    } catch {
        return null;
    }
}

function getUserRole() {
    const user = getCurrentUser();

    return user?.role ||
        user?.Role ||
        sessionStorage.getItem("role") ||
        "";
}

function isAdmin() {
    return getUserRole().toLowerCase() === "admin";
}

function requireLogin() {
    if (!sessionStorage.getItem("token")) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}

/*
 * Initializes common Bootstrap UI used by every page.
 * This is also used by login.html because login needs toast/loader.
 */
function initGlobalUi() {
    if (!document.getElementById("globalToastContainer")) {
        document.body.insertAdjacentHTML("beforeend", `
            <div id="globalToastContainer"
                 class="toast-container position-fixed top-0 end-0 p-3"
                 style="z-index: 1100;">
            </div>
        `);
    }

    if (!document.getElementById("globalLoader")) {
        document.body.insertAdjacentHTML("beforeend", `
            <div id="globalLoader"
                 class="position-fixed top-0 start-0 w-100 h-100 d-none"
                 style="z-index: 1200; background: rgba(255,255,255,.65);">

                <div class="d-flex justify-content-center align-items-center h-100">
                    <div class="text-center">
                        <div class="spinner-border text-primary"
                             role="status"
                             aria-label="Loading">
                        </div>

                        <div class="mt-2 text-secondary">
                            Loading...
                        </div>
                    </div>
                </div>

            </div>
        `);
    }
}

async function loadCommonLayout() {

    const sidebarContainer =
        document.getElementById("sidebar-container");

    const navbarContainer =
        document.getElementById("navbar-container");

    const mobileSidebarContainer =
        document.getElementById("mobile-sidebar-container");

    if (sidebarContainer) {

        const response =
            await fetch("../components/sidebar.html");

        if (!response.ok) {
            throw new Error("Unable to load sidebar.");
        }

        sidebarContainer.innerHTML =
            await response.text();
    }

    if (navbarContainer) {

        const response =
            await fetch("../components/navbar.html");

        if (!response.ok) {
            throw new Error("Unable to load navbar.");
        }

        navbarContainer.innerHTML =
            await response.text();
    }

    if (mobileSidebarContainer) {

        const response =
            await fetch("../components/mobile-sidebar.html");

        if (!response.ok) {
            throw new Error("Unable to load mobile sidebar.");
        }

        mobileSidebarContainer.innerHTML =
            await response.text();
    }

    const page =
        document.body.dataset.page || "";

    const pageTitle =
        document.body.dataset.pageTitle || "";

    const titleElement =
        document.getElementById("pageTitle");

    if (titleElement) {
        titleElement.textContent = pageTitle;
    }

    document.querySelectorAll("[data-nav-page]").forEach(link => {

        if (link.dataset.navPage === page) {
            link.classList.add("active");
        }

    });
}

async function setupCommonPage() {

    if (!requireLogin()) {
        return false;
    }

    try {

        initGlobalUi();

        await loadCommonLayout();

        const user = getCurrentUser();

        const nameElement =
            document.getElementById("currentUserName");

        const emailElement =
            document.getElementById("currentUserEmail");

        const roleElement =
            document.getElementById("currentUserRole");

        if (nameElement) {
            nameElement.textContent =
                user?.name ||
                user?.Name ||
                "User";
        }

        if (emailElement) {
            emailElement.textContent =
                user?.email ||
                user?.Email ||
                "";
        }

        if (roleElement) {
            roleElement.textContent =
                user?.role ||
                user?.Role ||
                "";
        }

        if (!isAdmin()) {

            document.querySelectorAll(".admin-only")
                .forEach(element => {
                    element.classList.add("d-none");
                });

        }

        document.getElementById("logoutButton")
            ?.addEventListener("click", showLogoutModal);

        document.getElementById("confirmLogoutButton")
            ?.addEventListener("click", logout);

        return true;

    } catch (error) {

        console.error(error);

        showToast(
            "Unable to load the page layout.",
            "danger"
        );

        return false;
    }
}

function showLoading() {

    initGlobalUi();

    document.getElementById("globalLoader")
        ?.classList.remove("d-none");
}

function hideLoading() {

    document.getElementById("globalLoader")
        ?.classList.add("d-none");
}

function showToast(message, type = "info") {

    initGlobalUi();

    const container =
        document.getElementById("globalToastContainer");

    if (!container) {
        return;
    }

    const typeMap = {
        success: "text-bg-success",
        danger: "text-bg-danger",
        warning: "text-bg-warning",
        info: "text-bg-info"
    };

    const iconMap = {
        success: "fa-circle-check",
        danger: "fa-circle-exclamation",
        warning: "fa-triangle-exclamation",
        info: "fa-circle-info"
    };

    const toast =
        document.createElement("div");

    toast.className =
        `toast ${typeMap[type] || typeMap.info}`;

    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");

    toast.innerHTML = `
        <div class="toast-header">

            <i class="fa ${
                iconMap[type] || iconMap.info
            } me-2"></i>

            <strong class="me-auto">
                Employee Task Tracker
            </strong>

            <button type="button"
                    class="btn-close"
                    data-bs-dismiss="toast">
            </button>

        </div>

        <div class="toast-body">
            ${escapeHtml(message)}
        </div>
    `;

    container.appendChild(toast);

    const instance =
        bootstrap.Toast.getOrCreateInstance(toast, {
            delay: 3500
        });

    instance.show();

    toast.addEventListener(
        "hidden.bs.toast",
        () => toast.remove()
    );
}

function showLogoutModal() {

    const modalElement =
        document.getElementById("logoutModal");

    if (!modalElement) {
        return;
    }

    bootstrap.Modal
        .getOrCreateInstance(modalElement)
        .show();
}

function logout() {

    sessionStorage.clear();

    window.location.href = "login.html";
}

function renderPagination(containerId, pageNumber, totalPages, onPageChangeFnName) {

    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }

    if (!totalPages || totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    const maxButtons = 5;

    let start = Math.max(1, pageNumber - Math.floor(maxButtons / 2));

    let end = Math.min(totalPages, start + maxButtons - 1);

    start = Math.max(1, end - maxButtons + 1);

    let pagesHtml = "";

    for (let page = start; page <= end; page++) {
        pagesHtml += `
            <li class="page-item ${page === pageNumber ? "active" : ""}">
                <button type="button" class="page-link" onclick="${onPageChangeFnName}(${page})">
                    ${page}
                </button>
            </li>
        `;
    }

    container.innerHTML = `
        <nav aria-label="Pagination">
            <ul class="pagination pagination-sm justify-content-end mb-0">

                <li class="page-item ${pageNumber <= 1 ? "disabled" : ""}">
                    <button type="button" class="page-link" onclick="${onPageChangeFnName}(${pageNumber - 1})">
                        <i class="fa fa-chevron-left"></i>
                    </button>
                </li>

                ${pagesHtml}

                <li class="page-item ${pageNumber >= totalPages ? "disabled" : ""}">
                    <button type="button" class="page-link" onclick="${onPageChangeFnName}(${pageNumber + 1})">
                        <i class="fa fa-chevron-right"></i>
                    </button>
                </li>

            </ul>
        </nav>
    `;
}

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getValue(obj, camel, pascal) {

    return obj?.[camel] ??
        obj?.[pascal];
}

function formatDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString();
}

function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString();
}
