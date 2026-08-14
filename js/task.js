let currentTaskPage = 1;

let taskPageSize = 10;

document.addEventListener("DOMContentLoaded", async () => {
  const ready = await setupCommonPage();

  if (!ready) {
    return;
  }

  applyUrlFilters();

  const pageSizeSelect = document.getElementById("taskPageSize");

  if (pageSizeSelect) {
    taskPageSize = Number(pageSizeSelect.value) || 10;

    pageSizeSelect.addEventListener("change", () => {
      taskPageSize = Number(pageSizeSelect.value) || 10;
      currentTaskPage = 1;
      loadTasks();
    });
  }

  await loadEmployees();
  await loadTasks();

  document.getElementById("taskForm")?.addEventListener("submit", saveTask);

  document.getElementById("filterButton")?.addEventListener("click", () => {
    currentTaskPage = 1;
    loadTasks();
  });

  document
    .getElementById("clearFilterButton")
    ?.addEventListener("click", clearFilters);

  document
    .getElementById("confirmStatusButton")
    ?.addEventListener("click", confirmStatusUpdate);

  document
    .getElementById("confirmDeleteButton")
    ?.addEventListener("click", confirmDeleteTask);
});

function applyUrlFilters() {
  const params = new URLSearchParams(window.location.search);

  const status = params.get("status") || "";

  const priority = params.get("priority") || "";

  const search = params.get("search") || "";

  document.getElementById("search").value = search;

  document.getElementById("filterStatus").value = status;

  document.getElementById("filterPriority").value = priority;
}

function clearFilters() {
  document.getElementById("search").value = "";

  document.getElementById("filterStatus").value = "";

  document.getElementById("filterPriority").value = "";

  window.history.replaceState({}, document.title, "tasks.html");

  currentTaskPage = 1;

  loadTasks();
}

function goToTaskPage(page) {
  if (page < 1) {
    return;
  }

  currentTaskPage = page;

  loadTasks();
}

async function loadEmployees() {
  if (!isAdmin()) {
    return;
  }

  try {
    const result = await apiRequest("/Employee");

    const employees = result?.data || [];

    const select = document.getElementById("assignedTo");

    select.innerHTML = `<option value="">
                Select employee
             </option>`;

    employees
      .filter((employee) => getValue(employee, "isActive", "IsActive"))
      .forEach((employee) => {
        const id = getValue(employee, "userId", "UserId");

        const name = getValue(employee, "name", "Name");

        select.innerHTML += `
                    <option value="${id}">
                        ${escapeHtml(name)}
                    </option>
                `;
      });
  } catch (error) {
    console.error(error);
  }
}

async function loadTasks() {
  const tbody = document.getElementById("taskTableBody");

  try {
    const search = document.getElementById("search").value.trim();

    const status = document.getElementById("filterStatus").value;

    const priority = document.getElementById("filterPriority").value;

    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    if (status) {
      params.set("status", status);
    }

    if (priority) {
      params.set("priority", priority);
    }

    params.set("pageNumber", currentTaskPage);

    params.set("pageSize", taskPageSize);

    const query = params.toString() ? `?${params.toString()}` : "";

    const result = await apiRequest(`/Tasks${query}`);

    const tasks = result?.data || [];

    currentTaskPage = result?.pageNumber || currentTaskPage;

    if (!tasks.length && currentTaskPage > 1 && (result?.totalCount || 0) > 0) {
      currentTaskPage -= 1;
      await loadTasks();
      return;
    }

    if (!tasks.length) {
      renderPagination("taskPagination", currentTaskPage, result?.totalPages || 0, "goToTaskPage");

      tbody.innerHTML = `
                <tr>
                    <td colspan="8"
                        class="text-center text-secondary py-4">

                        No tasks found.

                    </td>
                </tr>
            `;

      return;
    }

    tbody.innerHTML = tasks
      .map((task, index) => {
        const id = getValue(task, "taskId", "TaskId");

        const serialNo = (currentTaskPage - 1) * taskPageSize + index + 1;

        const title = getValue(task, "title", "Title");

        const assignedEmployee = getValue(
          task,
          "assignedEmployee",
          "AssignedEmployee",
        );

        const priority = getValue(task, "priority", "Priority");

        const status = getValue(task, "status", "Status");

        const dueDate = getValue(task, "dueDate", "DueDate");

        const completedOn = getValue(
          task,
          "statusUpdatedOn",
          "StatusUpdatedOn",
        );

        const statusClass =
          status?.toLowerCase() === "completed"
            ? "text-bg-success"
            : "text-bg-warning";

        const priorityClass =
          priority?.toLowerCase() === "high"
            ? "text-bg-danger"
            : "text-bg-info";

        return `
                    <tr>

                        <td>${serialNo}</td>

                        <td>
                            ${escapeHtml(title)}
                        </td>

                        <td>
                            ${escapeHtml(assignedEmployee)}
                        </td>

                        <td>
                            <span class="badge ${priorityClass}">
                                ${escapeHtml(priority)}
                            </span>
                        </td>

                        <td>
                            <span class="badge ${statusClass}">
                                ${escapeHtml(status)}
                            </span>
                        </td>

                        <td>
                            ${formatDateTime(dueDate)}
                        </td>

                        <td>
                            ${formatDateTime(completedOn)}
                        </td>
                        <td>

                            <button
                                class="btn btn-sm btn-outline-primary"
                                onclick="viewTask(${id})"
                                title="View">

                                <i class="fa fa-eye"></i>

                            </button>

                            ${
                              isAdmin()
                                ? `
                                        <button
                                            class="btn btn-sm btn-outline-primary"
                                            onclick="editTask(${id})"
                                            title="Edit">

                                            <i class="fa fa-edit"></i>

                                        </button>

                                        <button
                                            class="btn btn-sm btn-outline-danger"
                                            onclick="deleteTask(${id})"
                                            title="Delete">

                                            <i class="fa fa-trash"></i>

                                        </button>
                                      `
                                : status?.toLowerCase() === "completed"
                                  ? ``
                                  : `
                                        <button
                                            class="btn btn-sm btn-outline-success"
                                            onclick="toggleTaskStatus(${id}, '${status}')"
                                            title="Mark as Completed">

                                            <i class="fa fa-check"></i>

                                        </button>
                                      `
                            }

                        </td>

                    </tr>
                `;
      })
      .join("");

    renderPagination("taskPagination", currentTaskPage, result?.totalPages || 0, "goToTaskPage");
  } catch (error) {
    console.error(error);
  }
}

function openCreateTask() {
  document.getElementById("taskForm").reset();

  document.getElementById("taskId").value = "";

  document.getElementById("taskModalTitle").textContent = "Add Task";

  document.getElementById("taskEditNote").classList.add("d-none");

  document.getElementById("saveTaskButton").textContent = "Save";

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("taskModal"),
  ).show();
}

async function editTask(id) {
  try {
    const result = await apiRequest(`/Tasks/${id}`);

    const task = result?.data || {};

    document.getElementById("taskModalTitle").textContent = "Update Task";

    document.getElementById("taskEditNote").classList.remove("d-none");

    document.getElementById("saveTaskButton").textContent = "Update";

    document.getElementById("taskId").value = id;

    document.getElementById("taskTitle").value =
      getValue(task, "title", "Title") || "";

    document.getElementById("taskDescription").value =
      getValue(task, "description", "Description") || "";

    document.getElementById("assignedTo").value =
      getValue(task, "assignedTo", "AssignedTo") || "";

    document.getElementById("taskPriority").value =
      getValue(task, "priority", "Priority") || "Low";

    document.getElementById("dueDate").value = toDateTimeLocal(
      getValue(task, "dueDate", "DueDate"),
    );

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("taskModal"),
    ).show();
  } catch (error) {
    console.error(error);
  }
}

async function viewTask(id) {
  try {
    const result = await apiRequest(`/Tasks/${id}`);

    const task = result?.data || {};

    document.getElementById("viewTitle").textContent =
      getValue(task, "title", "Title") || "-";

    document.getElementById("viewDescription").textContent =
      getValue(task, "description", "Description") || "-";

    document.getElementById("viewAssignedTo").textContent =
      getValue(task, "assignedEmployee", "AssignedEmployee") || "-";

    document.getElementById("viewPriority").textContent =
      getValue(task, "priority", "Priority") || "-";

    document.getElementById("viewStatus").textContent =
      getValue(task, "status", "Status") || "-";

    document.getElementById("viewDueDate").textContent = formatDateTime(
      getValue(task, "dueDate", "DueDate"),
    );

    document.getElementById("viewStatusUpdatedOn").textContent = formatDateTime(
      getValue(task, "statusUpdatedOn", "StatusUpdatedOn"),
    );

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("viewTaskModal"),
    ).show();
  } catch (error) {
    console.error(error);
  }
}

async function saveTask(event) {
  event.preventDefault();

  const button = document.getElementById("saveTaskButton");

  button.disabled = true;

  button.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2"></span>
        Saving...
    `;

  try {
    const id = document.getElementById("taskId").value;

    const payload = {
      title: document.getElementById("taskTitle").value.trim(),

      description:
        document.getElementById("taskDescription").value.trim() || null,

      assignedTo: Number(document.getElementById("assignedTo").value),

      priority: document.getElementById("taskPriority").value,

      dueDate: document.getElementById("dueDate").value || null,
    };

    let result;

    if (!id) {
      result = await apiRequest("/Tasks", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } else {
      result = await apiRequest(`/Tasks/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    }

    showToast(
      result?.message ||
        (!id ? "Task added successfully." : "Task updated successfully."),
      "success",
    );

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("taskModal"),
    ).hide();

    if (!id) {
      currentTaskPage = 1;
    }

    await loadTasks();
  } catch (error) {
    console.error(error);
  } finally {
    button.disabled = false;

    button.innerHTML = document.getElementById("taskId").value
      ? "Update"
      : "Save";
  }
}

let pendingStatusTaskId = null;
let pendingStatusValue = null;

function toggleTaskStatus(id, currentStatus) {
  // Completed tasks do not have a status action.
  if (currentStatus?.toLowerCase() === "completed") {
    return;
  }

  pendingStatusTaskId = id;
  pendingStatusValue = "Completed";

  const modalElement = document.getElementById("statusConfirmModal");

  if (!modalElement) {
    return;
  }

  bootstrap.Modal.getOrCreateInstance(modalElement).show();
}

async function confirmStatusUpdate() {
  if (!pendingStatusTaskId || !pendingStatusValue) {
    return;
  }

  const taskId = pendingStatusTaskId;
  const newStatus = pendingStatusValue;

  const button = document.getElementById("confirmStatusButton");

  button.disabled = true;

  button.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>
    Updating...
  `;

  try {
    const result = await apiRequest(`/Tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: newStatus,
      }),
    });

    bootstrap.Modal.getOrCreateInstance(
      document.getElementById("statusConfirmModal"),
    ).hide();

    showToast(
      result?.message || "Task status updated successfully.",
      "success",
    );

    await loadTasks();
  } catch (error) {
    console.error(error);
  } finally {
    button.disabled = false;

    button.innerHTML = `
      <i class="fa fa-check me-1"></i>
      Yes, Continue
    `;

    pendingStatusTaskId = null;
    pendingStatusValue = null;
  }
}

let pendingDeleteTaskId = null;

function deleteTask(id) {
  pendingDeleteTaskId = id;

  const modalElement =
    document.getElementById("deleteConfirmModal");

  if (!modalElement) {
    return;
  }

  bootstrap.Modal
    .getOrCreateInstance(modalElement)
    .show();
}

async function confirmDeleteTask() {
  if (!pendingDeleteTaskId) {
    return;
  }

  const taskId = pendingDeleteTaskId;
  const button = document.getElementById("confirmDeleteButton");

  button.disabled = true;

  button.innerHTML = `
    <span class="spinner-border spinner-border-sm me-2"></span>
    Deleting...
  `;

  try {
    const result = await apiRequest(`/Tasks/${taskId}`, {
      method: "DELETE",
    });

    bootstrap.Modal
      .getOrCreateInstance(
        document.getElementById("deleteConfirmModal")
      )
      .hide();

    showToast(
      result?.message || "Task deleted successfully.",
      "success"
    );

    await loadTasks();
  } catch (error) {
    console.error(error);
  } finally {
    button.disabled = false;

    button.innerHTML = `
      <i class="fa fa-trash me-1"></i>
      Yes, Delete
    `;

    pendingDeleteTaskId = null;
  }
}

function toDateTimeLocal(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number) => String(number).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}
