const API_BASE_URL = "http://127.0.0.1:5000";

const taskList = document.getElementById("taskList");
const taskMessage = document.getElementById("taskMessage");
const refreshBtn = document.getElementById("refreshBtn");
const taskResultsSummary = document.getElementById("taskResultsSummary");

const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const pendingTasksEl = document.getElementById("pendingTasks");
const highPriorityTasksEl = document.getElementById("highPriorityTasks");
const overdueTasksCountEl = document.getElementById("overdueTasksCount");
const progressLabel = document.getElementById("progressLabel");
const progressFill = document.getElementById("progressFill");

const taskForm = document.getElementById("taskForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

const generateBtn = document.getElementById("generateBtn");
const clearSubtasksBtn = document.getElementById("clearSubtasksBtn");
const addManualSubtaskBtn = document.getElementById("addManualSubtaskBtn");
const manualSubtaskInput = document.getElementById("manualSubtaskInput");
const subtasksMessage = document.getElementById("subtasksMessage");
const subtasksList = document.getElementById("subtasksList");

const overdueList = document.getElementById("overdueList");
const upcomingList = document.getElementById("upcomingList");
const overdueMessage = document.getElementById("overdueMessage");
const upcomingMessage = document.getElementById("upcomingMessage");

const projectList = document.getElementById("projectList");
const projectMessage = document.getElementById("projectMessage");

const searchInput = document.getElementById("searchInput");
const priorityFilter = document.getElementById("priorityFilter");
const statusFilter = document.getElementById("statusFilter");
const projectFilter = document.getElementById("projectFilter");
const sortTasksSelect = document.getElementById("sortTasks");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

const toastContainer = document.getElementById("toastContainer");

const editModalOverlay = document.getElementById("editModalOverlay");
const closeEditModalBtn = document.getElementById("closeEditModalBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editTaskForm = document.getElementById("editTaskForm");
const saveEditBtn = document.getElementById("saveEditBtn");
const editTaskId = document.getElementById("editTaskId");
const editTitle = document.getElementById("editTitle");
const editDueDate = document.getElementById("editDueDate");
const editPriority = document.getElementById("editPriority");
const editStatus = document.getElementById("editStatus");
const editProjectId = document.getElementById("editProjectId");
const editDescription = document.getElementById("editDescription");

let generatedSubtasks = [];
let allTasks = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function capitalizeText(text) {
  if (!text) return "Not set";
  return text
    .toString()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSubtasks(subtasks) {
  if (!Array.isArray(subtasks)) return [];

  return subtasks
    .map((subtask) => {
      if (typeof subtask === "string") return subtask.trim();
      if (subtask && typeof subtask.title === "string") return subtask.title.trim();
      return "";
    })
    .filter(Boolean);
}

function formatDate(dateString) {
  if (!dateString) return "No due date";

  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;

  return parsed.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatDateForInput(dateString) {
  if (!dateString) return "";
  const parsed = new Date(dateString);
  if (Number.isNaN(parsed.getTime())) return dateString;
  return parsed.toISOString().split("T")[0];
}

function todayDateString() {
  return new Date().toISOString().split("T")[0];
}

function getPriorityClass(priority) {
  const value = (priority || "").toLowerCase();
  if (value === "high") return "priority-high";
  if (value === "medium") return "priority-medium";
  return "priority-low";
}

function getStatusClass(status) {
  const value = (status || "").toLowerCase();
  if (value === "completed") return "status-completed";
  if (value === "in-progress") return "status-in-progress";
  return "status-pending";
}

function getPriorityRank(priority) {
  const value = (priority || "").toLowerCase();
  if (value === "high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function isOverdue(task) {
  if (!task.due_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.due_date);
  if (Number.isNaN(dueDate.getTime())) return false;

  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today && (task.status || "").toLowerCase() !== "completed";
}

function isUpcoming(task) {
  if (!task.due_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.due_date);
  if (Number.isNaN(dueDate.getTime())) return false;

  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate - today;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= 3 && (task.status || "").toLowerCase() !== "completed";
}

function setFormMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = "form-message";
  if (type) formMessage.classList.add(type);
}

function showToast(message, type = "info") {
  if (!toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3200);
}

function validateTaskFields({ title, dueDate, status }) {
  if (!title) {
    return "Task title is required.";
  }

  if (dueDate && dueDate < todayDateString() && status !== "completed") {
    return "Past due dates should be used only for completed tasks.";
  }

  return "";
}

function getCurrentSubtasksFromDom() {
  if (!subtasksList) return [];

  return Array.from(subtasksList.querySelectorAll(".subtask-inline-input"))
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function syncGeneratedSubtasksFromDom() {
  generatedSubtasks = getCurrentSubtasksFromDom();
}

function renderGeneratedSubtasks() {
  if (!subtasksList || !subtasksMessage) return;

  subtasksList.innerHTML = "";

  if (generatedSubtasks.length === 0) {
    subtasksMessage.textContent = "No subtasks generated yet.";
    subtasksMessage.className = "form-message";
    return;
  }

  subtasksMessage.textContent = `Ready to save ${generatedSubtasks.length} subtask(s).`;
  subtasksMessage.className = "form-message success";

  generatedSubtasks.forEach((subtask, index) => {
    const li = document.createElement("li");
    li.className = "subtask-item";

    li.innerHTML = `
      <div class="subtask-row">
        <span class="subtask-number">${index + 1}.</span>
        <input
          type="text"
          class="subtask-inline-input"
          data-index="${index}"
          value="${escapeHtml(subtask)}"
          placeholder="Edit subtask"
        />
        <button type="button" class="text-btn remove-subtask-btn" data-index="${index}">Remove</button>
      </div>
    `;

    subtasksList.appendChild(li);
  });
}

function addManualSubtask() {
  const value = manualSubtaskInput.value.trim();

  if (!value) {
    showToast("Write a subtask before adding it.", "error");
    return;
  }

  syncGeneratedSubtasksFromDom();
  generatedSubtasks.push(value);
  manualSubtaskInput.value = "";
  renderGeneratedSubtasks();
  showToast("Subtask added.", "success");
}

function clearGeneratedSubtasks() {
  generatedSubtasks = [];
  renderGeneratedSubtasks();
}

function updateDashboardCards(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(
    (task) => (task.status || "").toLowerCase() === "completed"
  ).length;
  const pending = tasks.filter(
    (task) => (task.status || "").toLowerCase() === "pending"
  ).length;
  const highPriority = tasks.filter(
    (task) => (task.priority || "").toLowerCase() === "high"
  ).length;
  const overdue = tasks.filter(isOverdue).length;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  pendingTasksEl.textContent = pending;
  highPriorityTasksEl.textContent = highPriority;
  overdueTasksCountEl.textContent = overdue;
  progressLabel.textContent = `${completionRate}% completed`;
  progressFill.style.width = `${completionRate}%`;
}

function renderEmptyState(message) {
  taskList.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function renderErrorState(message) {
  taskList.innerHTML = `<div class="error-state">${escapeHtml(message)}</div>`;
}

function updateResultsSummary(tasks) {
  const visible = tasks.length;
  const total = allTasks.length;

  if (visible === total) {
    taskResultsSummary.textContent = `Showing all ${total} task(s).`;
    return;
  }

  taskResultsSummary.textContent = `Showing ${visible} of ${total} task(s).`;
}

function createTaskCard(task) {
  const taskCard = document.createElement("div");
  taskCard.className = "task-card";

  const title = escapeHtml(task.title || "Untitled Task");
  const description = escapeHtml(task.description || "No description provided.");
  const dueDate = formatDate(task.due_date);
  const priority = capitalizeText(task.priority || "low");
  const status = capitalizeText(task.status || "pending");
  const project = escapeHtml(task.project_id || "No Project");
  const subtasks = normalizeSubtasks(task.subtasks);
  const subtaskPreview = subtasks.length
    ? `
      <div class="task-details">
        <span class="badge status-in-progress">AI Subtasks: ${subtasks.length}</span>
      </div>
      <ul class="project-task-list">
        ${subtasks
          .slice(0, 3)
          .map((subtask) => `<li class="project-task-item">${escapeHtml(subtask)}</li>`)
          .join("")}
      </ul>
    `
    : "";

  taskCard.innerHTML = `
    <div class="task-card-header">
      <div>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>

      <div class="task-card-actions">
        ${
          (task.status || "").toLowerCase() !== "completed"
            ? `<button type="button" class="action-btn complete-btn" data-action="complete" data-id="${escapeHtml(task._id || "")}">Mark Completed</button>`
            : ""
        }
        <button type="button" class="action-btn edit-btn" data-action="edit" data-id="${escapeHtml(task._id || "")}">Edit</button>
        <button type="button" class="action-btn delete-btn" data-action="delete" data-id="${escapeHtml(task._id || "")}">Delete</button>
      </div>
    </div>

    <div class="task-details">
      <span class="badge ${getPriorityClass(task.priority)}">Priority: ${escapeHtml(priority)}</span>
      <span class="badge ${getStatusClass(task.status)}">Status: ${escapeHtml(status)}</span>
      <span class="badge status-pending">Due: ${escapeHtml(dueDate)}</span>
      <span class="badge status-pending">Project: ${project}</span>
    </div>

    ${subtaskPreview}
  `;

  return taskCard;
}

function renderTaskList(tasks) {
  taskList.innerHTML = "";

  if (!Array.isArray(tasks) || tasks.length === 0) {
    renderEmptyState("No tasks match the current filters.");
    return;
  }

  tasks.forEach((task) => {
    taskList.appendChild(createTaskCard(task));
  });
}

function renderReminderItem(task, type) {
  const div = document.createElement("div");
  div.className = `reminder-item ${type === "overdue" ? "overdue-item" : "upcoming-item"}`;
  div.innerHTML = `
    <h4>${escapeHtml(task.title || "Untitled Task")}</h4>
    <p>Due: ${escapeHtml(formatDate(task.due_date))}</p>
    <p>Status: ${escapeHtml(capitalizeText(task.status || "pending"))}</p>
  `;
  return div;
}

function renderReminders(tasks) {
  if (!overdueList || !upcomingList || !overdueMessage || !upcomingMessage) return;

  overdueList.innerHTML = "";
  upcomingList.innerHTML = "";

  const overdueTasks = tasks.filter(isOverdue);
  const upcomingTasks = tasks.filter(isUpcoming);

  if (overdueTasks.length === 0) {
    overdueMessage.textContent = "";
    overdueList.innerHTML = `<div class="reminder-empty-state">No overdue tasks.</div>`;
  } else {
    overdueMessage.textContent = "";
    overdueTasks.forEach((task) => {
      overdueList.appendChild(renderReminderItem(task, "overdue"));
    });
  }

  if (upcomingTasks.length === 0) {
    upcomingMessage.textContent = "";
    upcomingList.innerHTML = `<div class="reminder-empty-state">No upcoming tasks.</div>`;
  } else {
    upcomingMessage.textContent = "";
    upcomingTasks.forEach((task) => {
      upcomingList.appendChild(renderReminderItem(task, "upcoming"));
    });
  }
}

function renderProjectEmptyState(message) {
  if (!projectList) return;
  projectList.innerHTML = `<div class="project-empty-state">${escapeHtml(message)}</div>`;
}

function renderProjectErrorState(message) {
  if (!projectList) return;
  projectList.innerHTML = `<div class="project-error-state">${escapeHtml(message)}</div>`;
}

function renderProjects(tasks) {
  if (!projectList || !projectMessage) return;

  projectList.innerHTML = "";

  if (!Array.isArray(tasks) || tasks.length === 0) {
    projectMessage.textContent = "";
    renderProjectEmptyState("No projects available yet.");
    return;
  }

  const groupedProjects = {};

  tasks.forEach((task) => {
    const rawProjectId = task.project_id ?? "";
    const projectKey =
      String(rawProjectId).trim() !== "" ? String(rawProjectId).trim() : "No Project";

    if (!groupedProjects[projectKey]) {
      groupedProjects[projectKey] = [];
    }

    groupedProjects[projectKey].push(task);
  });

  const projectNames = Object.keys(groupedProjects).sort((a, b) => a.localeCompare(b));

  if (projectNames.length === 0) {
    projectMessage.textContent = "";
    renderProjectEmptyState("No projects available yet.");
    return;
  }

  projectMessage.textContent = "";

  projectNames.forEach((projectName) => {
    const projectCard = document.createElement("div");
    projectCard.className = "project-card";

    const projectTasks = groupedProjects[projectName];
    const completedCount = projectTasks.filter(
      (task) => (task.status || "").toLowerCase() === "completed"
    ).length;

    const taskItems = projectTasks
      .map((task) => {
        const title = escapeHtml(task.title || "Untitled Task");
        const status = escapeHtml(capitalizeText(task.status || "pending"));
        return `<li class="project-task-item">${title} — ${status}</li>`;
      })
      .join("");

    projectCard.innerHTML = `
      <h3>${escapeHtml(projectName)}</h3>
      <p>${projectTasks.length} task(s) • ${completedCount} completed</p>
      <ul class="project-task-list">
        ${taskItems}
      </ul>
    `;

    projectList.appendChild(projectCard);
  });
}

function populateProjectFilter(tasks) {
  if (!projectFilter) return;

  const currentValue = projectFilter.value || "all";
  const projects = Array.from(
    new Set(
      tasks
        .map((task) => String(task.project_id || "").trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  projectFilter.innerHTML = '<option value="all">All Projects</option>';

  projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    projectFilter.appendChild(option);
  });

  projectFilter.value = projects.includes(currentValue) ? currentValue : "all";
}

function sortTasks(tasks) {
  const sortValue = sortTasksSelect.value;
  const sorted = [...tasks];

  sorted.sort((a, b) => {
    if (sortValue === "title-asc") {
      return String(a.title || "").localeCompare(String(b.title || ""));
    }

    if (sortValue === "status-asc") {
      return String(a.status || "").localeCompare(String(b.status || ""));
    }

    if (sortValue === "priority-desc") {
      return getPriorityRank(b.priority) - getPriorityRank(a.priority);
    }

    if (sortValue === "priority-asc") {
      return getPriorityRank(a.priority) - getPriorityRank(b.priority);
    }

    const aDate = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
    const bDate = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;

    if (sortValue === "due-desc") {
      return bDate - aDate;
    }

    return aDate - bDate;
  });

  return sorted;
}

function getFilteredTasks() {
  const searchValue = searchInput.value.trim().toLowerCase();
  const priorityValue = priorityFilter.value;
  const statusValue = statusFilter.value;
  const projectValue = projectFilter.value;

  const filtered = allTasks.filter((task) => {
    const matchesSearch =
      !searchValue ||
      String(task.title || "").toLowerCase().includes(searchValue) ||
      String(task.description || "").toLowerCase().includes(searchValue);

    const matchesPriority = priorityValue === "all" || (task.priority || "").toLowerCase() === priorityValue;
    const matchesStatus = statusValue === "all" || (task.status || "").toLowerCase() === statusValue;

    const normalizedProject = String(task.project_id || "").trim();
    const matchesProject = projectValue === "all" || normalizedProject === projectValue;

    return matchesSearch && matchesPriority && matchesStatus && matchesProject;
  });

  return sortTasks(filtered);
}

function applyFiltersAndRender() {
  const filteredTasks = getFilteredTasks();
  updateResultsSummary(filteredTasks);
  renderTaskList(filteredTasks);
}

function openEditModal(taskId) {
  const task = allTasks.find((item) => item._id === taskId);

  if (!task) {
    showToast("Could not find the selected task.", "error");
    return;
  }

  editTaskId.value = task._id || "";
  editTitle.value = task.title || "";
  editDueDate.value = formatDateForInput(task.due_date);
  editPriority.value = task.priority || "low";
  editStatus.value = task.status || "pending";
  editProjectId.value = task.project_id || "";
  editDescription.value = task.description || "";

  editModalOverlay.classList.remove("hidden");
}

function closeEditModal() {
  editModalOverlay.classList.add("hidden");
  editTaskForm.reset();
  editTaskId.value = "";
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  let result = null;

  try {
    result = await response.json();
  } catch (error) {
    result = null;
  }

  if (!response.ok) {
    const message = result?.error || "Request failed.";
    throw new Error(message);
  }

  return result;
}

async function loadTasks() {
  taskMessage.textContent = "Loading tasks...";
  taskList.innerHTML = "";

  if (projectMessage) {
    projectMessage.textContent = "Loading projects...";
    projectList.innerHTML = "";
  }

  if (overdueMessage && upcomingMessage && overdueList && upcomingList) {
    overdueMessage.textContent = "Checking overdue tasks...";
    upcomingMessage.textContent = "Checking upcoming tasks...";
    overdueList.innerHTML = "";
    upcomingList.innerHTML = "";
  }

  try {
    const tasks = await requestJson(`${API_BASE_URL}/tasks`);

    allTasks = Array.isArray(tasks)
      ? tasks.map((task) => ({ ...task, subtasks: normalizeSubtasks(task.subtasks) }))
      : [];

    populateProjectFilter(allTasks);
    updateDashboardCards(allTasks);
    taskMessage.textContent = "";

    if (allTasks.length === 0) {
      updateResultsSummary([]);
      renderEmptyState("No tasks available yet.");
      renderProjectEmptyState("No projects available yet.");
      overdueList.innerHTML = `<div class="reminder-empty-state">No overdue tasks.</div>`;
      upcomingList.innerHTML = `<div class="reminder-empty-state">No upcoming tasks.</div>`;
      projectMessage.textContent = "";
      overdueMessage.textContent = "";
      upcomingMessage.textContent = "";
      return;
    }

    applyFiltersAndRender();
    renderProjects(allTasks);
    renderReminders(allTasks);
  } catch (error) {
    console.error("Error loading tasks:", error);
    allTasks = [];
    updateDashboardCards([]);
    taskMessage.textContent = "";
    renderErrorState("Could not load tasks. Make sure the backend is running.");

    if (projectMessage) {
      projectMessage.textContent = "";
      renderProjectErrorState("Could not load project view.");
    }

    if (overdueMessage && upcomingMessage && overdueList && upcomingList) {
      overdueMessage.textContent = "";
      upcomingMessage.textContent = "";
      overdueList.innerHTML = `<div class="error-state">Could not load overdue tasks.</div>`;
      upcomingList.innerHTML = `<div class="error-state">Could not load upcoming tasks.</div>`;
    }

    showToast(error.message || "Could not load tasks.", "error");
  }
}

async function handleGenerateSubtasks() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!title) {
    setFormMessage("Enter a task title before generating subtasks.", "error");
    return;
  }

  syncGeneratedSubtasksFromDom();
  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  subtasksMessage.textContent = "Generating subtasks...";

  try {
    const result = await requestJson(`${API_BASE_URL}/api/generate-subtasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description
      })
    });

    generatedSubtasks = normalizeSubtasks(result.subtasks);
    renderGeneratedSubtasks();
    setFormMessage("Subtasks generated successfully.", "success");
    showToast("AI subtasks generated.", "success");
  } catch (error) {
    console.error("Error generating subtasks:", error);
    generatedSubtasks = [];
    renderGeneratedSubtasks();
    setFormMessage(error.message || "Could not generate subtasks.", "error");
    showToast(error.message || "Could not generate subtasks.", "error");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Subtasks";
  }
}

async function handleTaskSubmit(event) {
  event.preventDefault();

  syncGeneratedSubtasksFromDom();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const due_date = document.getElementById("due_date").value;
  const priority = document.getElementById("priority").value;
  const status = document.getElementById("status").value;
  const project_id = document.getElementById("project_id").value.trim();

  const validationMessage = validateTaskFields({
    title,
    dueDate: due_date,
    status
  });

  if (validationMessage) {
    setFormMessage(validationMessage, "error");
    showToast(validationMessage, "error");
    return;
  }

  const taskData = {
    title,
    description,
    due_date,
    priority,
    status,
    subtasks: generatedSubtasks
  };

  if (project_id) {
    taskData.project_id = project_id;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";
  setFormMessage("Submitting task...");

  try {
    await requestJson(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskData)
    });

    setFormMessage("Task created successfully.", "success");
    showToast("Task created successfully.", "success");
    taskForm.reset();
    clearGeneratedSubtasks();
    await loadTasks();
  } catch (error) {
    console.error("Error creating task:", error);
    setFormMessage(error.message || "Could not create task.", "error");
    showToast(error.message || "Could not create task.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Task";
  }
}

async function updateTask(taskId, payload, successMessage = "Task updated successfully.") {
  if (!taskId) {
    showToast("This task cannot be updated because it has no ID.", "error");
    return;
  }

  try {
    await requestJson(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    showToast(successMessage, "success");
    await loadTasks();
  } catch (error) {
    console.error("Error updating task:", error);
    showToast(error.message || "Could not update task.", "error");
  }
}

async function deleteTask(taskId) {
  if (!taskId) {
    showToast("This task cannot be deleted because it has no ID.", "error");
    return;
  }

  const confirmed = window.confirm("Are you sure you want to delete this task?");
  if (!confirmed) return;

  try {
    await requestJson(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "DELETE"
    });

    showToast("Task deleted successfully.", "success");
    await loadTasks();
  } catch (error) {
    console.error("Error deleting task:", error);
    showToast(error.message || "Could not delete task.", "error");
  }
}

async function handleEditTaskSubmit(event) {
  event.preventDefault();

  const taskId = editTaskId.value;
  const title = editTitle.value.trim();
  const dueDate = editDueDate.value;
  const status = editStatus.value;

  const validationMessage = validateTaskFields({
    title,
    dueDate,
    status
  });

  if (validationMessage) {
    showToast(validationMessage, "error");
    return;
  }

  saveEditBtn.disabled = true;
  saveEditBtn.textContent = "Saving...";

  const payload = {
    title,
    due_date: dueDate,
    priority: editPriority.value,
    status,
    project_id: editProjectId.value.trim(),
    description: editDescription.value.trim()
  };

  try {
    await requestJson(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    closeEditModal();
    showToast("Task changes saved.", "success");
    await loadTasks();
  } catch (error) {
    console.error("Error saving task changes:", error);
    showToast(error.message || "Could not save task changes.", "error");
  } finally {
    saveEditBtn.disabled = false;
    saveEditBtn.textContent = "Save Changes";
  }
}

function handleTaskListClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;

  if (action === "complete") {
    updateTask(id, { status: "completed" }, "Task marked as completed.");
    return;
  }

  if (action === "edit") {
    openEditModal(id);
    return;
  }

  if (action === "delete") {
    deleteTask(id);
  }
}

function handleSubtasksClick(event) {
  const removeButton = event.target.closest(".remove-subtask-btn");
  if (!removeButton) return;

  const index = Number(removeButton.dataset.index);
  syncGeneratedSubtasksFromDom();
  generatedSubtasks = generatedSubtasks.filter((_, itemIndex) => itemIndex !== index);
  renderGeneratedSubtasks();
}

function handleSubtasksInput(event) {
  if (!event.target.classList.contains("subtask-inline-input")) return;

  const index = Number(event.target.dataset.index);
  generatedSubtasks[index] = event.target.value;
}

function clearFilters() {
  searchInput.value = "";
  priorityFilter.value = "all";
  statusFilter.value = "all";
  projectFilter.value = "all";
  sortTasksSelect.value = "due-asc";
  applyFiltersAndRender();
}

function setupSidebarNavigation() {
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const sectionIds = ["dashboard", "taskCreator", "tasks", "projects", "reminders"];
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      const id = visibleEntry.target.id;
      navItems.forEach((item) => {
        item.classList.toggle("active", item.getAttribute("href") === `#${id}`);
      });
    },
    {
      rootMargin: "-20% 0px -65% 0px",
      threshold: [0.2, 0.4, 0.6]
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupEventListeners() {
  if (refreshBtn) refreshBtn.addEventListener("click", loadTasks);
  if (taskForm) taskForm.addEventListener("submit", handleTaskSubmit);
  if (generateBtn) generateBtn.addEventListener("click", handleGenerateSubtasks);
  if (clearSubtasksBtn) clearSubtasksBtn.addEventListener("click", clearGeneratedSubtasks);
  if (addManualSubtaskBtn) addManualSubtaskBtn.addEventListener("click", addManualSubtask);
  if (manualSubtaskInput) {
    manualSubtaskInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addManualSubtask();
      }
    });
  }

  if (subtasksList) {
    subtasksList.addEventListener("click", handleSubtasksClick);
    subtasksList.addEventListener("input", handleSubtasksInput);
  }

  if (taskList) taskList.addEventListener("click", handleTaskListClick);

  [searchInput, priorityFilter, statusFilter, projectFilter, sortTasksSelect].forEach((element) => {
    if (!element) return;
    element.addEventListener("input", applyFiltersAndRender);
    element.addEventListener("change", applyFiltersAndRender);
  });

  if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", clearFilters);

  if (editTaskForm) editTaskForm.addEventListener("submit", handleEditTaskSubmit);
  if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", closeEditModal);
  if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditModal);
  if (editModalOverlay) {
    editModalOverlay.addEventListener("click", (event) => {
      if (event.target === editModalOverlay) {
        closeEditModal();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && editModalOverlay && !editModalOverlay.classList.contains("hidden")) {
      closeEditModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderGeneratedSubtasks();
  setupEventListeners();
  setupSidebarNavigation();
  loadTasks();
});
