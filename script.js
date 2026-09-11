// =========================
// TO-DO LIST APPLICATION
// =========================

// Constants
const STORAGE_KEY = 'todoTasks';
const FILTER_KEY = 'todoFilter';

// DOM Elements
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const tasksList = document.getElementById('tasks-list');
const emptyState = document.getElementById('empty-state');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const remainingCount = document.getElementById('remaining-count');
const pluralSpan = document.getElementById('plural');

// Application State
let tasks = [];
let currentFilter = 'all';

// =========================
// INITIALIZATION
// =========================

// Initialize application
function init() {
    loadTasks();
    loadFilter();
    render();
    setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    filterBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            setFilter(e.target.dataset.filter);
        });
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);
}

// =========================
// TASK MANAGEMENT
// =========================

// Add a new task
function addTask() {
    const text = taskInput.value.trim();

    if (text === '') {
        taskInput.focus();
        return;
    }

    const task = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
    };

    tasks.push(task);
    saveTasks();
    taskInput.value = '';
    taskInput.focus();
    render();
}

// Toggle task completion
function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        render();
    }
}

// Delete a task
function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    render();
}

// Edit a task
function editTask(id) {
    const taskItem = document.querySelector(`[data-id="${id}"]`);
    const taskText = taskItem.querySelector('.task-text');
    const editInput = taskItem.querySelector('.task-edit-input');
    const editBtn = taskItem.querySelector('.edit-btn');
    const taskActions = taskItem.querySelector('.task-actions');

    // Show edit input
    taskText.classList.add('editing');
    editInput.classList.remove('hidden');
    editInput.value = taskText.textContent;
    editInput.focus();
    editInput.select();

    // Replace edit button with save/cancel buttons
    editBtn.innerHTML = '';
    editBtn.classList.remove('edit-btn');

    const saveBtn = document.createElement('button');
    saveBtn.className = 'task-btn save-btn';
    saveBtn.textContent = '✓ Save';
    saveBtn.addEventListener('click', () => saveEdit(id));

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'task-btn cancel-btn';
    cancelBtn.textContent = '✕ Cancel';
    cancelBtn.addEventListener('click', () => cancelEdit(id));

    editBtn.appendChild(saveBtn);
    taskActions.insertBefore(cancelBtn, editBtn.nextSibling);

    // Allow saving with Enter key
    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveEdit(id);
        } else if (e.key === 'Escape') {
            cancelEdit(id);
        }
    });
}

// Save edited task
function saveEdit(id) {
    const taskItem = document.querySelector(`[data-id="${id}"]`);
    const editInput = taskItem.querySelector('.task-edit-input');
    const newText = editInput.value.trim();

    if (newText === '') {
        editInput.focus();
        return;
    }

    const task = tasks.find((t) => t.id === id);
    if (task) {
        task.text = newText;
        saveTasks();
        render();
    }
}

// Cancel edit
function cancelEdit(id) {
    saveTasks();
    render();
}

// Clear all completed tasks
function clearCompleted() {
    tasks = tasks.filter((t) => !t.completed);
    saveTasks();
    render();
}

// =========================
// FILTERING
// =========================

// Set the current filter
function setFilter(filter) {
    currentFilter = filter;
    localStorage.setItem(FILTER_KEY, filter);

    // Update active filter button
    filterBtns.forEach((btn) => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    render();
}

// Get filtered tasks
function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter((t) => !t.completed);
        case 'completed':
            return tasks.filter((t) => t.completed);
        case 'all':
        default:
            return tasks;
    }
}

// =========================
// RENDERING
// =========================

// Render all tasks
function render() {
    const filteredTasks = getFilteredTasks();

    // Clear the task list
    tasksList.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    // Render each task
    filteredTasks.forEach((task) => {
        const li = createTaskElement(task);
        tasksList.appendChild(li);
    });

    updateRemainingCount();
}

// Create a task element
function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Task text
    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    // Edit input
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.className = 'task-edit-input hidden';
    editInput.value = task.text;

    // Task actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn edit-btn';
    editBtn.textContent = '✏️ Edit';
    editBtn.addEventListener('click', () => editTask(task.id));

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn delete-btn';
    deleteBtn.textContent = '🗑️ Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    // Append all elements
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(editInput);
    li.appendChild(actionsDiv);

    return li;
}

// Update remaining task count
function updateRemainingCount() {
    const activeTasks = tasks.filter((t) => !t.completed);
    const count = activeTasks.length;

    remainingCount.textContent = count;
    pluralSpan.textContent = count === 1 ? '' : 's';

    // Disable clear button if no completed tasks
    const completedTasks = tasks.filter((t) => t.completed);
    clearCompletedBtn.disabled = completedTasks.length === 0;
}

// =========================
// STORAGE
// =========================

// Load tasks from localStorage
function loadTasks() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        tasks = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
    }
}

// Save tasks to localStorage
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

// Load filter from localStorage
function loadFilter() {
    const stored = localStorage.getItem(FILTER_KEY);
    if (stored && ['all', 'active', 'completed'].includes(stored)) {
        currentFilter = stored;
    }

    // Update active filter button
    filterBtns.forEach((btn) => {
        btn.classList.remove('active');
        if (btn.dataset.filter === currentFilter) {
            btn.classList.add('active');
        }
    });
}

// =========================
// START APPLICATION
// =========================

init();
