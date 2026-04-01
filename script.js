const API_BASE_URL = "http://127.0.0.1:5000";

const taskList = document.getElementById("taskList");
const taskMessage = document.getElementById("taskMessage");
const refreshBtn = document.getElementById("refreshBtn");

const totalTasksEl = document.getElementById("totalTasks");
const completedTasksEl = document.getElementById("completedTasks");
const pendingTasksEl = document.getElementById("pendingTasks");

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

function createTaskCard(task) {
  const taskCard = document.createElement("div");
  taskCard.className = "task-card";

  const title = task.title || "Untitled Task";
  const description = task.description || "No description provided.";
  const dueDate = formatDate(task.due_date);
  const priority = capitalizeText(task.priority || "low");
  const status = capitalizeText(task.status || "pending");

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

  return taskCard;
}

async function loadTasks() {
  taskMessage.textContent = "Loading tasks...";
  taskList.innerHTML = "";

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
      return;
    }

    updateDashboardCards(tasks);
    taskMessage.textContent = "";

    tasks.forEach((task) => {
      const taskCard = createTaskCard(task);
      taskList.appendChild(taskCard);
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
    taskMessage.textContent = "";
    renderErrorState("Could not load tasks. Make sure the backend is running.");
  }
}

refreshBtn.addEventListener("click", loadTasks);
document.addEventListener("DOMContentLoaded", loadTasks);