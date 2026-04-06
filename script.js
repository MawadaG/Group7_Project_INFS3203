const API_BASE_URL = "http://127.0.0.1:5000";

const taskList = document.getElementById("taskList");
const taskMessage = document.getElementById("taskMessage");
const refreshBtn = document.getElementById("refreshBtn");

const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const pendingTasksEl = document.getElementById("pendingTasks");

const taskForm = document.getElementById("taskForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");

const generateBtn = document.getElementById("generateBtn");
const clearSubtasksBtn = document.getElementById("clearSubtasksBtn");
const subtasksMessage = document.getElementById("subtasksMessage");
const subtasksList = document.getElementById("subtasksList");

const overdueList = document.getElementById("overdueList");
const upcomingList = document.getElementById("upcomingList");
const overdueMessage = document.getElementById("overdueMessage");
const upcomingMessage = document.getElementById("upcomingMessage");

const projectList = document.getElementById("projectList");
const projectMessage = document.getElementById("projectMessage");

let generatedSubtasks = [];

function capitalizeText(text) {
  if (!text) return "Not set";
  return text
    .toString()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function formatDate(dateString) {
  if (!dateString) return "No due date";
  return dateString;
}

function updateDashboardCards(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(
    (task) => (task.status || "").toLowerCase() === "completed"
  ).length;
  const pending = tasks.filter(
    (task) => (task.status || "").toLowerCase() === "pending"
  ).length;

  totalTasksEl.textContent = total;
  completedTasksEl.textContent = completed;
  pendingTasksEl.textContent = pending;
}

function renderEmptyState(message) {
  taskList.innerHTML = `<div class="empty-state">${message}</div>`;
}

function renderErrorState(message) {
  taskList.innerHTML = `<div class="error-state">${message}</div>`;
}

function setFormMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = "form-message";
  if (type) formMessage.classList.add(type);
}

function renderGeneratedSubtasks() {
  if (!subtasksList || !subtasksMessage) return;

  subtasksList.innerHTML = "";

  if (generatedSubtasks.length === 0) {
    subtasksMessage.textContent = "No subtasks generated yet.";
    subtasksMessage.className = "form-message";
    return;
  }

  subtasksMessage.textContent = `Generated ${generatedSubtasks.length} subtasks.`;
  subtasksMessage.className = "form-message success";

  generatedSubtasks.forEach((subtask, index) => {
    const li = document.createElement("li");
    li.className = "subtask-item";
    li.textContent = `${index + 1}. ${subtask}`;
    subtasksList.appendChild(li);
  });
}

function clearGeneratedSubtasks() {
  generatedSubtasks = [];
  renderGeneratedSubtasks();
}

function createTaskCard(task) {
  const taskCard = document.createElement("div");
  taskCard.className = "task-card";

  const title = task.title || "Untitled Task";
  const description = task.description || "No description provided.";
  const dueDate = formatDate(task.due_date);
  const priority = capitalizeText(task.priority || "low");
  const status = capitalizeText(task.status || "pending");
  const deleteBtn = document.createElement("button");
  const completeBtn = document.createElement("button");
  const actionsDiv = document.createElement("div");

  deleteBtn.textContent = "Delete";
  deleteBtn.className = "secondary-btn";

  deleteBtn.addEventListener("click", async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task._id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      // Refresh tasks after deletion
      loadTasks();

    } catch (error) {
      console.error("Error deleting task:", error);
    }
  });

  completeBtn.textContent = "Complete";
  completeBtn.className = "submit-btn";
  completeBtn.type = "button";
  completeBtn.style.marginRight = "10px";

  completeBtn.addEventListener("click", async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task._id}/complete`, {
        method: "PATCH"
      });

      if (!response.ok) {
        throw new Error("Failed to complete task");
      }

      await loadTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      taskMessage.textContent = "Could not complete task.";
    }
  });

  taskCard.innerHTML = `
    <div class="task-card-header">
      <div>
        <h3>${title}</h3>
        <p>${description}</p>
      </div>
    </div>

    <div class="task-details">
      <span class="badge ${getPriorityClass(task.priority)}">Priority: ${priority}</span>
      <span class="badge ${getStatusClass(task.status)}">Status: ${status}</span>
      <span class="badge status-pending">Due: ${dueDate}</span>
    </div>
  `;

  actionsDiv.className = "form-actions";

  actionsDiv.appendChild(completeBtn);
  actionsDiv.appendChild(deleteBtn);

  taskCard.appendChild(actionsDiv);

  return taskCard;
}

function isOverdue(task) {
  if (!task.due_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.due_date);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today && (task.status || "").toLowerCase() !== "completed";
}

function isUpcoming(task) {
  if (!task.due_date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.due_date);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate - today;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  return diffDays >= 0 && diffDays <= 3 && (task.status || "").toLowerCase() !== "completed";
}

function renderReminderItem(task, type) {
  const div = document.createElement("div");
  div.className = `reminder-item ${type === "overdue" ? "overdue-item" : "upcoming-item"}`;
  div.innerHTML = `
    <h4>${task.title || "Untitled Task"}</h4>
    <p>Due: ${formatDate(task.due_date)}</p>
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
  projectList.innerHTML = `<div class="project-empty-state">${message}</div>`;
}

function renderProjectErrorState(message) {
  if (!projectList) return;
  projectList.innerHTML = `<div class="project-error-state">${message}</div>`;
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

  const projectNames = Object.keys(groupedProjects);

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

    const taskItems = projectTasks
      .map((task) => {
        const title = task.title || "Untitled Task";
        return `<li class="project-task-item">${title}</li>`;
      })
      .join("");

    projectCard.innerHTML = `
      <h3>${projectName}</h3>
      <p>${projectTasks.length} task(s)</p>
      <ul class="project-task-list">
        ${taskItems}
      </ul>
    `;

    projectList.appendChild(projectCard);
  });
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
    const response = await fetch(`${API_BASE_URL}/tasks`);

    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }

    const tasks = await response.json();

    if (!Array.isArray(tasks) || tasks.length === 0) {
      updateDashboardCards([]);
      taskMessage.textContent = "";
      renderEmptyState("No tasks available yet.");

      if (projectMessage) {
        projectMessage.textContent = "";
        renderProjectEmptyState("No projects available yet.");
      }

      if (overdueMessage && upcomingMessage && overdueList && upcomingList) {
        overdueMessage.textContent = "";
        upcomingMessage.textContent = "";
        overdueList.innerHTML = `<div class="reminder-empty-state">No overdue tasks.</div>`;
        upcomingList.innerHTML = `<div class="reminder-empty-state">No upcoming tasks.</div>`;
      }

      return;
    }

    updateDashboardCards(tasks);
    taskMessage.textContent = "";

    tasks.forEach((task) => {
      taskList.appendChild(createTaskCard(task));
    });

    renderProjects(tasks);
    renderReminders(tasks);
  } catch (error) {
    console.error("Error loading tasks:", error);
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
  }
}

async function handleGenerateSubtasks() {
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();

  if (!title) {
    setFormMessage("Enter a task title before generating subtasks.", "error");
    return;
  }

  generateBtn.disabled = true;
  generateBtn.textContent = "Generating...";
  subtasksMessage.textContent = "Generating subtasks...";

  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-subtasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        description
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to generate subtasks");
    }

    generatedSubtasks = Array.isArray(result.subtasks) ? result.subtasks : [];
    renderGeneratedSubtasks();
    setFormMessage("Subtasks generated successfully.", "success");
  } catch (error) {
    console.error("Error generating subtasks:", error);
    generatedSubtasks = [];
    renderGeneratedSubtasks();
    setFormMessage(error.message || "Could not generate subtasks.", "error");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Subtasks";
  }
}

async function handleTaskSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const due_date = document.getElementById("due_date").value;
  const priority = document.getElementById("priority").value;
  const status = document.getElementById("status").value;
  const project_id = document.getElementById("project_id").value.trim();

  if (!title) {
    setFormMessage("Task title is required.", "error");
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
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(taskData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to create task");
    }

    setFormMessage("Task created successfully.", "success");
    taskForm.reset();
    clearGeneratedSubtasks();
    await loadTasks();
  } catch (error) {
    console.error("Error creating task:", error);
    setFormMessage(error.message || "Could not create task.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Task";
  }
}

function setupSidebarNavigation() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
    });
  });
}

if (refreshBtn) refreshBtn.addEventListener("click", loadTasks);
if (taskForm) taskForm.addEventListener("submit", handleTaskSubmit);
if (generateBtn) generateBtn.addEventListener("click", handleGenerateSubtasks);
if (clearSubtasksBtn) clearSubtasksBtn.addEventListener("click", clearGeneratedSubtasks);

document.addEventListener("DOMContentLoaded", () => {
  renderGeneratedSubtasks();
  loadTasks();
  setupSidebarNavigation();
});