(function() {
    'use strict';

    // ---------- DOM references ----------
    const taskListEl = document.getElementById('taskList');
    const emptyStateEl = document.getElementById('emptyState');
    const taskCountEl = document.getElementById('taskCount');
    const taskForm = document.getElementById('taskForm');
    const taskInput = document.getElementById('taskInput');

    const filterBtns = document.querySelectorAll('.filter-btn');
    let currentFilter = 'all';

    // Modal elements
    const editModal = document.getElementById('editModal');
    const editInput = document.getElementById('editInput');
    const editForm = document.getElementById('editForm');
    const closeModalBtn = document.getElementById('closeModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');

    // ---------- State ----------
    // Sample tasks to demonstrate real-world usage
    let tasks = [
        { id: 1, text: 'Call Mr. Rahul to confirm appointment', completed: false },
        { id: 2, text: 'Prepare lab reports for Dr. Sharma', completed: true },
        { id: 3, text: 'Schedule follow-up for Mrs. Gupta', completed: false },
        { id: 4, text: 'Update patient insurance details', completed: false },
    ];

    let nextId = 5; // for new tasks

    // Currently editing task id (null if not editing)
    let editingId = null;

    // ---------- Helper: Render tasks ----------
    function render() {
        // Filter tasks based on currentFilter
        let filtered = [];
        if (currentFilter === 'all') {
            filtered = tasks;
        } else if (currentFilter === 'active') {
            filtered = tasks.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filtered = tasks.filter(t => t.completed);
        }

        // Clear list
        taskListEl.innerHTML = '';

        if (filtered.length === 0) {
            emptyStateEl.style.display = 'block';
            taskListEl.style.display = 'none';
        } else {
            emptyStateEl.style.display = 'none';
            taskListEl.style.display = 'flex';

            // Build each task item using DOM traversal friendly structure
            filtered.forEach(task => {
                const li = document.createElement('li');
                li.className = 'task-item' + (task.completed ? ' completed' : '');
                li.dataset.id = task.id;

                // Checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'task-checkbox';
                checkbox.checked = task.completed;
                // Event: toggle completed
                checkbox.addEventListener('change', function(e) {
                    e.stopPropagation();
                    toggleTaskCompletion(task.id);
                });

                // Text span
                const textSpan = document.createElement('span');
                textSpan.className = 'task-text';
                textSpan.textContent = task.text;

                // Actions container
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'task-actions';

                // Edit button
                const editBtn = document.createElement('button');
                editBtn.className = 'edit-btn';
                editBtn.innerHTML = '✏️';
                editBtn.setAttribute('aria-label', 'Edit task');
                editBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    openEditModal(task.id);
                });

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-btn';
                deleteBtn.innerHTML = '🗑️';
                deleteBtn.setAttribute('aria-label', 'Delete task');
                deleteBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    deleteTask(task.id);
                });

                actionsDiv.appendChild(editBtn);
                actionsDiv.appendChild(deleteBtn);

                li.appendChild(checkbox);
                li.appendChild(textSpan);
                li.appendChild(actionsDiv);

                taskListEl.appendChild(li);
            });
        }

        updateTaskCount();
        updateFilterButtons();
    }

    // ---------- Update task count ----------
    function updateTaskCount() {
        const total = tasks.length;
        const active = tasks.filter(t => !t.completed).length;
        taskCountEl.textContent = `${active} active · ${total} total`;
    }

    // ---------- Update filter button active state ----------
    function updateFilterButtons() {
        filterBtns.forEach(btn => {
            const filter = btn.dataset.filter;
            btn.classList.toggle('active', filter === currentFilter);
        });
    }

    // ---------- CRUD Operations ----------

    // Add task
    function addTask(text) {
        const trimmed = text.trim();
        if (!trimmed) return false;
        const newTask = {
            id: nextId++,
            text: trimmed,
            completed: false
        };
        tasks.push(newTask);
        render();
        return true;
    }

    // Delete task
    function deleteTask(id) {
        if (!confirm('Delete this task?')) return;
        tasks = tasks.filter(t => t.id !== id);
        render();
        // DOM traversal example: we could also find the element and remove, but we re-render.
    }

    // Toggle completion
    function toggleTaskCompletion(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            render();
        }
    }

    // Edit task (save)
    function saveEdit(id, newText) {
        const trimmed = newText.trim();
        if (!trimmed) return false;
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.text = trimmed;
            render();
            closeEditModal();
            return true;
        }
        return false;
    }

    // ---------- Modal Control ----------
    function openEditModal(id) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        editingId = id;
        editInput.value = task.text;
        editModal.classList.add('open');
        editInput.focus();
        editInput.select();
    }

    function closeEditModal() {
        editModal.classList.remove('open');
        editingId = null;
        editInput.value = '';
    }

    // ---------- Event Listeners ----------

    // Add task form
    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const text = taskInput.value;
        if (addTask(text)) {
            taskInput.value = '';
            taskInput.focus();
        }
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            if (filter === currentFilter) return;
            currentFilter = filter;
            render();
        });
    });

    // Edit form submit
    editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (editingId !== null) {
            saveEdit(editingId, editInput.value);
        }
    });

    // Close modal: close button, cancel button, click outside
    closeModalBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });

    // Keyboard: Escape to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && editModal.classList.contains('open')) {
            closeEditModal();
        }
    });

    // ---------- Initial Render ----------
    render();

})();