let editingEmployeeId = null;

document.addEventListener("DOMContentLoaded", async () => {

    const ready =
        await setupCommonPage();

    if (!ready) {
        return;
    }

    if (!isAdmin()) {

        showToast(
            "Only Admin users can access employee management.",
            "danger"
        );

        setTimeout(() => {
            window.location.href =
                "dashboard.html";
        }, 1000);

        return;
    }

    await loadEmployees();

    document.getElementById("employeeForm")
        ?.addEventListener(
            "submit",
            saveEmployee
        );

    document.getElementById("toggleEmployeePassword")
        ?.addEventListener(
            "click",
            toggleEmployeePassword
        );
});

async function loadEmployees() {

    const tbody =
        document.getElementById(
            "employeeTableBody"
        );

    try {

        const result =
            await apiRequest("/Employee");

        const employees =
            result?.data ||
            [];

        if (!employees.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6"
                        class="text-center text-secondary py-4">
                        No employees found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML =
            employees.map(employee => {

                const id =
                    getValue(
                        employee,
                        "userId",
                        "UserId"
                    );

                const name =
                    getValue(
                        employee,
                        "name",
                        "Name"
                    );

                const email =
                    getValue(
                        employee,
                        "email",
                        "Email"
                    );

                const role =
                    getValue(
                        employee,
                        "role",
                        "Role"
                    );

                const active =
                    getValue(
                        employee,
                        "isActive",
                        "IsActive"
                    );

                return `
                    <tr>

                        <td>${id}</td>

                        <td>
                            ${escapeHtml(name)}
                        </td>

                        <td>
                            ${escapeHtml(email)}
                        </td>

                        <td>
                            ${escapeHtml(role)}
                        </td>

                        <td>

                            <span class="badge ${
                                active
                                    ? "text-bg-success"
                                    : "text-bg-danger"
                            }">

                                ${
                                    active
                                        ? "Active"
                                        : "Inactive"
                                }

                            </span>

                        </td>

                        <td>

                            <button
                                class="btn btn-sm btn-outline-primary"
                                onclick="editEmployee(${id})"
                                title="Edit">

                                <i class="fa fa-edit"></i>

                            </button>

                        </td>

                    </tr>
                `;

            }).join("");

    } catch (error) {

        console.error(error);
    }
}

function openCreateEmployee() {

    editingEmployeeId =
        null;

    document.getElementById(
        "employeeModalTitle"
    ).textContent =
        "Add Employee";

    document.getElementById(
        "employeeForm"
    ).reset();

    document.getElementById(
        "employeePasswordGroup"
    ).classList.remove("d-none");

    document.getElementById(
        "employeePassword"
    ).value = "";

    document.getElementById(
        "employeeIsActive"
    ).checked = true;

    const icon =
        document
            .getElementById("toggleEmployeePassword")
            ?.querySelector("i");

    const input =
        document.getElementById(
            "employeePassword"
        );

    if (input) {
        input.type = "password";
    }

    if (icon) {
        icon.classList.remove(
            "fa-eye-slash"
        );

        icon.classList.add(
            "fa-eye"
        );
    }

    bootstrap.Modal
        .getOrCreateInstance(
            document.getElementById(
                "employeeModal"
            )
        )
        .show();
}

async function editEmployee(id) {

    try {

        const result =
            await apiRequest(
                `/Employee/${id}`
            );

        const employee =
            result?.data ||
            {};

        editingEmployeeId =
            id;

        document.getElementById(
            "employeeModalTitle"
        ).textContent =
            "Update Employee";

        document.getElementById(
            "employeeName"
        ).value =
            getValue(
                employee,
                "name",
                "Name"
            ) || "";

        document.getElementById(
            "employeeEmail"
        ).value =
            getValue(
                employee,
                "email",
                "Email"
            ) || "";

        document.getElementById(
            "employeePasswordGroup"
        ).classList.add("d-none");

        document.getElementById(
            "employeeIsActive"
        ).checked =
            getValue(
                employee,
                "isActive",
                "IsActive"
            ) ?? true;

        bootstrap.Modal
            .getOrCreateInstance(
                document.getElementById(
                    "employeeModal"
                )
            )
            .show();

    } catch (error) {

        console.error(error);
    }
}

async function saveEmployee(event) {

    event.preventDefault();

    const button =
        document.getElementById(
            "saveEmployeeButton"
        );

    button.disabled = true;

    button.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Saving...
    `;

    try {

        const name =
            document.getElementById(
                "employeeName"
            ).value.trim();

        const email =
            document.getElementById(
                "employeeEmail"
            ).value.trim();

        let result;

        if (editingEmployeeId === null) {

            const password =
                document.getElementById(
                    "employeePassword"
                ).value;

            result =
                await apiRequest(
                    "/Employee",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            name,
                            email,
                            password
                        })
                    }
                );

        } else {

            const isActive =
                document.getElementById(
                    "employeeIsActive"
                ).checked;

            result =
                await apiRequest(
                    `/Employee/${editingEmployeeId}`,
                    {
                        method: "PUT",
                        body: JSON.stringify({
                            name,
                            email,
                            isActive
                        })
                    }
                );
        }

        showToast(
            result?.message ||
            (
                editingEmployeeId === null
                    ? "Employee added successfully."
                    : "Employee updated successfully."
            ),
            "success"
        );

        bootstrap.Modal
            .getOrCreateInstance(
                document.getElementById(
                    "employeeModal"
                )
            )
            .hide();

        await loadEmployees();

    } catch (error) {

        console.error(error);

    } finally {

        button.disabled = false;
        button.innerHTML = "Save";
    }
}

function toggleEmployeePassword() {

    const input =
        document.getElementById(
            "employeePassword"
        );

    const icon =
        document
            .getElementById(
                "toggleEmployeePassword"
            )
            .querySelector("i");

    if (input.type === "password") {

        input.type = "text";

        icon.classList.replace(
            "fa-eye",
            "fa-eye-slash"
        );

    } else {

        input.type = "password";

        icon.classList.replace(
            "fa-eye-slash",
            "fa-eye"
        );
    }
}
