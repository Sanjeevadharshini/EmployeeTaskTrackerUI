document.addEventListener("DOMContentLoaded", () => {
  initGlobalUi();

  if (sessionStorage.getItem("token")) {
    window.location.href = "dashboard.html";
    return;
  }

  const passwordInput = document.getElementById("password");

  const togglePassword = document.getElementById("togglePassword");

  togglePassword?.addEventListener("click", () => {
    const icon = togglePassword.querySelector("i");

    if (passwordInput.type === "password") {
      passwordInput.type = "text";

      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      passwordInput.type = "password";

      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });

  document.getElementById("loginForm")?.addEventListener("submit", login);
});

async function login(event) {
  event.preventDefault();

  const button = document.getElementById("loginButton");

  const email = document.getElementById("email").value.trim();

  const password = document.getElementById("password").value;

  button.disabled = true;

  button.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Login...
    `;

  showLoading();

  try {
    const response = await fetch(`${API_BASE_URL}/Auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      showToast(
        result?.message || result?.title || "Invalid email or password.",
        "danger",
      );

      return;
    }

    const data = result?.data || result;

    const token = data?.token || data?.Token;

    if (!token) {
      showToast(
        "Login succeeded, but JWT token was not returned by the API.",
        "danger",
      );

      return;
    }

    sessionStorage.setItem("token", token);

    sessionStorage.setItem("user", JSON.stringify(data));

    const role = data.role;

    if (role) {
      sessionStorage.setItem("role", role);
    }

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);

    if (error instanceof TypeError) {
      showToast("Unable to connect to the API.", "danger");
    }
  } finally {
    hideLoading();

    button.disabled = false;

    button.innerHTML = "Login";
  }
}
