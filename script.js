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
  if (type) {
    formMessage.classList.add(type);
  }
}

function renderGeneratedSubtasks() {
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
      taskList.appendChild(createTaskCard(task));
    });
  } catch (error) {
    console.error("Error loading tasks:", error);
    taskMessage.textContent = "";
    renderErrorState("Could not load tasks. Make sure the backend is running.");
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

refreshBtn.addEventListener("click", loadTasks);
taskForm.addEventListener("submit", handleTaskSubmit);
generateBtn.addEventListener("click", handleGenerateSubtasks);
clearSubtasksBtn.addEventListener("click", clearGeneratedSubtasks);

document.addEventListener("DOMContentLoaded", () => {
  renderGeneratedSubtasks();
  loadTasks();
});
refreshBtn.addEventListener("click", loadTasks);
document.addEventListener("DOMContentLoaded", loadTasks);
