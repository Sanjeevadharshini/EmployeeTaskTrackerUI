document.addEventListener("DOMContentLoaded", async () => {
  const ready = await setupCommonPage();

  if (!ready) {
    return;
  }

  await loadDashboard();
});

async function loadDashboard() {
  try {
    const result = await apiRequest("/Dashboard");

    const data = result?.data || result || {};

    const statistics = data.statistics || data.Statistics || {};

    const recentTasks = data.recentTasks || data.RecentTasks || [];

    document.getElementById("totalTasks").textContent =
      statistics.totalTasks ?? statistics.TotalTasks ?? 0;

    document.getElementById("pendingTasks").textContent =
      statistics.pendingTasks ?? statistics.PendingTasks ?? 0;

    document.getElementById("completedTasks").textContent =
      statistics.completedTasks ?? statistics.CompletedTasks ?? 0;

    document.getElementById("highPriorityTasks").textContent =
      statistics.highPriorityTasks ?? statistics.HighPriorityTasks ?? 0;

    loadRecentTasks(recentTasks);
  } catch (error) {
    console.error(error);
  }
}

function loadRecentTasks(tasks) {
  const tbody = document.getElementById("recentTasksBody");

  if (!tbody) {
    return;
  }

  if (!tasks.length) {
    tbody.innerHTML = `
            <tr>
                <td colspan="5"
                    class="text-center text-secondary py-4">
                    No recent tasks.
                </td>
            </tr>
        `;

    return;
  }

  tbody.innerHTML = tasks
    .map((task) => {
      const title = task.title ?? task.Title;

      const assignedEmployee = task.assignedEmployee ?? task.AssignedEmployee;

      const priority = task.priority ?? task.Priority;

      const status = task.status ?? task.Status;

      const dueDate = task.dueDate ?? task.DueDate;

      const CompletedOn = task.statusUpdatedOn ?? task.StatusUpdatedOn;

      const priorityClass =
        priority?.toLowerCase() === "high" ? "text-bg-danger" : "text-bg-info";

      const statusClass =
        status?.toLowerCase() === "completed"
          ? "text-bg-success"
          : "text-bg-warning";

      return `
                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(title)}
                        </strong>
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
                        ${formatDateTime(CompletedOn)}
                    </td>

                </tr>
            `;
    })
    .join("");
}

function goToTasks(filter = {}) {
  const params = new URLSearchParams();

  if (filter.status) {
    params.set("status", filter.status);
  }

  if (filter.priority) {
    params.set("priority", filter.priority);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  window.location.href = `tasks.html${query}`;
}
