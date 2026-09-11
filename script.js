// =========================
// TASKFLOW - PRODUCTIVITY APP
// =========================

// =====================================================
// CONFIGURATION & CONSTANTS
// =====================================================

const CONFIG = {
    STORAGE_TASKS: 'taskflow_tasks',
    STORAGE_THEME: 'taskflow_theme',
    STORAGE_FILTER: 'taskflow_filter',
};

const CATEGORIES = ['Personal', 'University', 'Work', 'Shopping', 'Health', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const VIEWS = ['dashboard', 'all', 'today', 'upcoming', 'completed', 'important', 'overdue', 'category', 'settings'];

// =====================================================
// APPLICATION STATE
// =====================================================

let appState = {
    tasks: [],
    currentView: 'dashboard',
    currentFilter: 'all',
    currentSort: 'newest',
    currentCategory: null,
    searchQuery: '',
    isDarkMode: false,
    editingTaskId: null,
};

// =====================================================
// DOM ELEMENTS
// =====================================================

const elements = {
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    sidebarToggle: document.getElementById('sidebar-toggle'),
    sidebar: document.querySelector('.sidebar'),

    // Header
    pageTitle: document.getElementById('page-title'),
    searchInput: document.getElementById('search-input'),
    themeToggle: document.getElementById('theme-toggle'),

    // Views
    viewSections: document.querySelectorAll('.view-section'),

    // Dashboard
    totalTasks: document.getElementById('total-tasks'),
    pendingTasks: document.getElementById('pending-tasks'),
    completedTasks: document.getElementById('completed-tasks'),
    overdueTasks: document.getElementById('overdue-tasks'),
    progressBar: document.getElementById('progress-bar'),
    completionPercentage: document.getElementById('completion-percentage'),
    recentTasks: document.getElementById('recent-tasks'),

    // Task Lists
    allTasksList: document.getElementById('all-tasks-list'),
    todayTasksList: document.getElementById('today-tasks-list'),
    upcomingTasksList: document.getElementById('upcoming-tasks-list'),
    completedTasksList: document.getElementById('completed-tasks-list'),
    importantTasksList: document.getElementById('important-tasks-list'),
    overdueTasksList: document.getElementById('overdue-tasks-list'),
    categoryTasksList: document.getElementById('category-tasks-list'),

    // Controls
    filterBtns: document.querySelectorAll('.filter-btn'),
    sortSelect: document.getElementById('sort-select'),
    categoriesNav: document.getElementById('categories-nav'),

    // FAB & Modals
    addTaskBtn: document.getElementById('add-task-btn'),
    taskModal: document.getElementById('task-modal'),
    taskForm: document.getElementById('task-form'),
    modalClose: document.getElementById('modal-close'),
    modalTitle: document.getElementById('modal-title'),
    formCancelBtn: document.getElementById('form-cancel-btn'),

    // Form Fields
    taskTitle: document.getElementById('task-title'),
    taskDescription: document.getElementById('task-description'),
    taskCategory: document.getElementById('task-category'),
    taskPriority: document.getElementById('task-priority'),
    taskDueDate: document.getElementById('task-due-date'),
    taskDueTime: document.getElementById('task-due-time'),

    // Confirmation
    confirmModal: document.getElementById('confirm-modal'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
    confirmProceedBtn: document.getElementById('confirm-proceed-btn'),

    // Settings
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    clearCompletedBtn: document.getElementById('clear-completed-btn'),
    clearAllBtn: document.getElementById('clear-all-btn'),
    resetAppBtn: document.getElementById('reset-app-btn'),

    // Other
    emptyState: document.getElementById('empty-state'),
    toastContainer: document.getElementById('toast-container'),
};

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    loadTasks();
    loadTheme();
    setupEventListeners();
    renderCategoriesNav();
    setView('dashboard');
    updateDashboard();
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {
    // Navigation
    elements.navItems.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            if (VIEWS.includes(view)) {
                setView(view);
            }
        });
    });

    elements.sidebarToggle.addEventListener('click', toggleSidebar);

    // Header
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.searchInput.addEventListener('input', handleSearch);

    // FAB
    elements.addTaskBtn.addEventListener('click', openAddModal);

    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.formCancelBtn.addEventListener('click', closeModal);
    elements.taskForm.addEventListener('submit', handleFormSubmit);

    // Confirmation
    elements.confirmCancelBtn.addEventListener('click', closeConfirmModal);
    elements.confirmProceedBtn.addEventListener('click', handleConfirmAction);

    // Settings
    elements.darkModeToggle.addEventListener('click', toggleDarkMode);
    elements.clearCompletedBtn.addEventListener('click', () => showConfirmDialog('Clear all completed tasks?', clearCompleted));
    elements.clearAllBtn.addEventListener('click', () => showConfirmDialog('Clear all tasks? This cannot be undone.', clearAllTasks));
    elements.resetAppBtn.addEventListener('click', () => showConfirmDialog('Reset application? This will delete all data.', resetApp));

    // Filter & Sort
    elements.filterBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            appState.currentFilter = e.currentTarget.dataset.filter;
            updateFilterButtons();
            renderCurrentView();
        });
    });

    elements.sortSelect.addEventListener('change', (e) => {
        appState.currentSort = e.target.value;
        renderCurrentView();
    });

    // Close modal on outside click
    elements.taskModal.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) closeModal();
    });

    elements.confirmModal.addEventListener('click', (e) => {
        if (e.target === elements.confirmModal) closeConfirmModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.taskModal.classList.contains('active')) {
            closeModal();
        }
    });
}

// =====================================================
// SIDEBAR & NAVIGATION
// =====================================================

function toggleSidebar() {
    elements.sidebar.classList.toggle('active');
}

function setView(view) {
    if (!VIEWS.includes(view)) return;

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        elements.sidebar.classList.remove('active');
    }

    appState.currentView = view;
    appState.currentFilter = 'all';

    // Update nav items
    elements.navItems.forEach((item) => {
        item.classList.remove('active');
        if (item.dataset.view === view) {
            item.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        all: 'All Tasks',
        today: "Today's Tasks",
        upcoming: 'Upcoming',
        completed: 'Completed',
        important: 'Important',
        overdue: 'Overdue',
        category: `${appState.currentCategory || 'Category'}`,
        settings: 'Settings',
    };
    elements.pageTitle.textContent = titles[view];

    renderCurrentView();

    if (view === 'dashboard') {
        updateDashboard();
    }
}

// =====================================================
// CATEGORIES
// =====================================================

function renderCategoriesNav() {
    elements.categoriesNav.innerHTML = '';

    CATEGORIES.forEach((category) => {
        const btn = document.createElement('button');
        btn.className = 'category-nav-item';
        btn.textContent = category;
        btn.addEventListener('click', () => {
            appState.currentCategory = category;
            setView('category');
        });
        elements.categoriesNav.appendChild(btn);
    });
}

// =====================================================
// THEME & APPEARANCE
// =====================================================

function toggleTheme() {
    appState.isDarkMode = !appState.isDarkMode;
    applyTheme();
    saveTheme();
}

function toggleDarkMode() {
    elements.darkModeToggle.classList.toggle('active');
    appState.isDarkMode = elements.darkModeToggle.classList.contains('active');
    applyTheme();
    saveTheme();
}

function applyTheme() {
    if (appState.isDarkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        elements.darkModeToggle.classList.add('active');
    } else {
        document.documentElement.removeAttribute('data-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        elements.darkModeToggle.classList.remove('active');
    }
}

function saveTheme() {
    localStorage.setItem(CONFIG.STORAGE_THEME, appState.isDarkMode ? 'dark' : 'light');
}

function loadTheme() {
    const theme = localStorage.getItem(CONFIG.STORAGE_THEME);
    if (theme === 'dark') {
        appState.isDarkMode = true;
    }
    applyTheme();
}

// =====================================================
// TASK MANAGEMENT
// =====================================================

function openAddModal() {
    appState.editingTaskId = null;
    elements.modalTitle.textContent = 'Add New Task';
    resetFormFields();
    elements.taskModal.classList.add('active');
    elements.taskTitle.focus();
    setMinDueDate();
}

function openEditModal(taskId) {
    const task = appState.tasks.find((t) => t.id === taskId);
    if (!task) return;

    appState.editingTaskId = taskId;
    elements.modalTitle.textContent = 'Edit Task';

    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description || '';
    elements.taskCategory.value = task.category;
    elements.taskPriority.value = task.priority;
    elements.taskDueDate.value = task.dueDate;
    elements.taskDueTime.value = task.dueTime || '';

    elements.taskModal.classList.add('active');
    elements.taskTitle.focus();
}

function closeModal() {
    elements.taskModal.classList.remove('active');
    resetFormFields();
}

function resetFormFields() {
    elements.taskForm.reset();
    elements.taskPriority.value = 'Medium';
    clearFormErrors();
}

function setMinDueDate() {
    const today = new Date().toISOString().split('T')[0];
    elements.taskDueDate.min = today;
}

function clearFormErrors() {
    document.querySelectorAll('.error-message').forEach((el) => {
        el.textContent = '';
    });
}

function handleFormSubmit(e) {
    e.preventDefault();

    // Validation
    const title = elements.taskTitle.value.trim();
    const category = elements.taskCategory.value;
    const dueDate = elements.taskDueDate.value;

    if (!title) {
        showError('title-error', 'Task title is required');
        return;
    }

    if (!category) {
        showError('category-error', 'Please select a category');
        return;
    }

    if (!dueDate) {
        showError('date-error', 'Please select a due date');
        return;
    }

    if (appState.editingTaskId) {
        updateTask(appState.editingTaskId, {
            title,
            description: elements.taskDescription.value.trim(),
            category,
            priority: elements.taskPriority.value,
            dueDate,
            dueTime: elements.taskDueTime.value,
        });
        showToast('Task updated successfully!', 'success');
    } else {
        addTask({
            title,
            description: elements.taskDescription.value.trim(),
            category,
            priority: elements.taskPriority.value,
            dueDate,
            dueTime: elements.taskDueTime.value,
        });
        showToast('Task created successfully!', 'success');
    }

    closeModal();
    renderCurrentView();
    updateDashboard();
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
    }
}

function addTask(taskData) {
    const task = {
        id: Date.now(),
        ...taskData,
        completed: false,
        createdAt: new Date().toISOString(),
    };

    appState.tasks.push(task);
    saveTasks();
}

function updateTask(taskId, taskData) {
    const task = appState.tasks.find((t) => t.id === taskId);
    if (task) {
        Object.assign(task, taskData);
        saveTasks();
    }
}

function deleteTask(taskId) {
    appState.tasks = appState.tasks.filter((t) => t.id !== taskId);
    saveTasks();
    renderCurrentView();
    updateDashboard();
    showToast('Task deleted', 'success');
}

function toggleTaskCompletion(taskId) {
    const task = appState.tasks.find((t) => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderCurrentView();
        updateDashboard();
    }
}

function clearCompleted() {
    const completedCount = appState.tasks.filter((t) => t.completed).length;
    appState.tasks = appState.tasks.filter((t) => !t.completed);
    saveTasks();
    renderCurrentView();
    updateDashboard();
    showToast(`${completedCount} task(s) cleared`, 'success');
    closeConfirmModal();
}

function clearAllTasks() {
    appState.tasks = [];
    saveTasks();
    renderCurrentView();
    updateDashboard();
    showToast('All tasks cleared', 'success');
    closeConfirmModal();
}

function resetApp() {
    localStorage.clear();
    location.reload();
}

// =====================================================
// FILTERING & SORTING
// =====================================================

function getFilteredAndSortedTasks() {
    let tasks = appState.tasks;

    // Apply status filter
    if (appState.currentFilter === 'active') {
        tasks = tasks.filter((t) => !t.completed);
    } else if (appState.currentFilter === 'completed') {
        tasks = tasks.filter((t) => t.completed);
    }

    // Apply search
    if (appState.searchQuery) {
        const query = appState.searchQuery.toLowerCase();
        tasks = tasks.filter(
            (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
        );
    }

    // Apply sorting
    tasks.sort((a, b) => {
        switch (appState.currentSort) {
            case 'oldest':
                return new Date(a.createdAt) - new Date(b.createdAt);
            case 'due-date':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { High: 0, Medium: 1, Low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            case 'alphabetical':
                return a.title.localeCompare(b.title);
            case 'newest':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    return tasks;
}

function handleSearch(e) {
    appState.searchQuery = e.target.value;
    renderCurrentView();
}

function updateFilterButtons() {
    elements.filterBtns.forEach((btn) => {
        btn.classList.remove('active');
        if (btn.dataset.filter === appState.currentFilter) {
            btn.classList.add('active');
        }
    });
}

// =====================================================
// VIEW RENDERING
// =====================================================

function renderCurrentView() {
    // Hide all views
    elements.viewSections.forEach((section) => {
        section.classList.remove('active');
    });

    // Show current view
    const viewId = `${appState.currentView}-view`;
    const viewElement = document.getElementById(viewId);
    if (viewElement) {
        viewElement.classList.add('active');
    }

    // Render content based on view
    switch (appState.currentView) {
        case 'all':
            renderAllTasks();
            break;
        case 'today':
            renderTodayTasks();
            break;
        case 'upcoming':
            renderUpcomingTasks();
            break;
        case 'completed':
            renderCompletedTasks();
            break;
        case 'important':
            renderImportantTasks();
            break;
        case 'overdue':
            renderOverdueTasks();
            break;
        case 'category':
            renderCategoryTasks();
            break;
    }
}

function renderAllTasks() {
    const tasks = getFilteredAndSortedTasks();
    updateFilterButtons();
    elements.allTasksList.innerHTML = renderTasks(tasks);
    handleEmptyState(tasks.length);
}

function renderTodayTasks() {
    const today = new Date().toISOString().split('T')[0];
    const tasks = appState.tasks
        .filter((t) => t.dueDate === today && !t.completed)
        .sort((a, b) => new Date(`${a.dueDate}T${a.dueTime || '00:00'}`) - new Date(`${b.dueDate}T${b.dueTime || '00:00'}`));
    elements.todayTasksList.innerHTML = renderTasks(tasks);
    handleEmptyState(tasks.length);
}

function renderUpcomingTasks() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const tasks = appState.tasks
        .filter((t) => !t.completed && t.dueDate > tomorrowStr)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    elements.upcomingTasksList.innerHTML = renderTasks(tasks);
    handleEmptyState(tasks.length);
}

function renderCompletedTasks() {
    const tasks = appState.tasks
        .filter((t) => t.completed)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    elements.completedTasksList.innerHTML = renderTasks(tasks);
    handleEmptyState(tasks.length);
}

function renderImportantTasks() {
    const tasks = appState.tasks
        .filter((t) => t.priority === 'High' && !t.completed)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    elements.importantTasksList.innerHTML = renderTasks(tasks);
    handleEmptyState(tasks.length);
}

function renderOverdueTasks() {
    const today = new Date().toISOString().split('T')[0];
    const tasks = appState.tasks
        .filter((t) => !t.completed && t.dueDate < today)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    elements.overdueTasksList.innerHTML = renderTasks(tasks);
    handleEmptyState(tasks.length);
}

function renderCategoryTasks() {
    const tasks = appState.tasks
        .filter((t) => t.category === appState.currentCategory)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    elements.categoryTasksList.innerHTML = renderTasks(tasks);
    handleEmptyState(tasks.length);
}

function renderTasks(tasks) {
    if (tasks.length === 0) {
        return '';
    }

    return tasks
        .map((task) => {
            const isOverdue = !task.completed && new Date(task.dueDate) < new Date().toISOString().split('T')[0];
            const dueDateFormatted = formatDate(task.dueDate);

            return `
                <li class="task-card ${task.completed ? 'completed' : ''}">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                        onchange="toggleTaskCompletion(${task.id})" aria-label="Mark task complete">
                    
                    <div class="task-content">
                        <div class="task-header">
                            <p class="task-title">${escapeHtml(task.title)}</p>
                        </div>
                        
                        ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ''}
                        
                        <div class="task-meta">
                            <span class="badge badge-category">${task.category}</span>
                            <span class="badge badge-priority ${task.priority.toLowerCase()}">${task.priority}</span>
                            ${isOverdue ? '<span class="badge badge-overdue"><i class="fas fa-exclamation-circle"></i> Overdue</span>' : ''}
                            <div class="task-due-date">
                                <i class="fas fa-calendar"></i>
                                ${dueDateFormatted}
                                ${task.dueTime ? ` at ${task.dueTime}` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="task-actions">
                        <button class="btn btn-sm btn-secondary btn-icon" onclick="openEditModal(${task.id})" 
                            aria-label="Edit task" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger btn-icon" onclick="deleteTask(${task.id})" 
                            aria-label="Delete task" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </li>
            `;
        })
        .join('');
}

function handleEmptyState(taskCount) {
    if (taskCount === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.emptyState.classList.add('active');
    } else {
        elements.emptyState.classList.add('hidden');
        elements.emptyState.classList.remove('active');
    }
}

// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {
    const total = appState.tasks.length;
    const completed = appState.tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const today = new Date().toISOString().split('T')[0];
    const overdue = appState.tasks.filter((t) => !t.completed && t.dueDate < today).length;

    elements.totalTasks.textContent = total;
    elements.pendingTasks.textContent = pending;
    elements.completedTasks.textContent = completed;
    elements.overdueTasks.textContent = overdue;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    elements.progressBar.style.width = percentage + '%';
    elements.completionPercentage.textContent = percentage;

    renderRecentTasks();
}

function renderRecentTasks() {
    const recent = appState.tasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

    elements.recentTasks.innerHTML = renderTasks(recent);
}

// =====================================================
// CONFIRMATION DIALOG
// =====================================================

let pendingAction = null;

function showConfirmDialog(message, action) {
    elements.confirmMessage.textContent = message;
    pendingAction = action;
    elements.confirmModal.classList.add('active');
}

function closeConfirmModal() {
    elements.confirmModal.classList.remove('active');
    pendingAction = null;
}

function handleConfirmAction() {
    if (typeof pendingAction === 'function') {
        pendingAction();
    }
    closeConfirmModal();
}

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<i class="fas fa-check-circle"></i>',
        error: '<i class="fas fa-exclamation-circle"></i>',
        warning: '<i class="fas fa-exclamation-triangle"></i>',
    };

    toast.innerHTML = `${icons[type] || ''} <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastSlideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// =====================================================
// STORAGE
// =====================================================

function saveTasks() {
    localStorage.setItem(CONFIG.STORAGE_TASKS, JSON.stringify(appState.tasks));
}

function loadTasks() {
    try {
        const stored = localStorage.getItem(CONFIG.STORAGE_TASKS);
        appState.tasks = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading tasks:', error);
        appState.tasks = [];
    }
}

// =====================================================
// UTILITIES
// =====================================================

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =====================================================
// RESPONSIVE
// =====================================================

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        elements.sidebar.classList.remove('active');
    }
});