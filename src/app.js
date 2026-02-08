(function () {
  "use strict";

  const STORAGE_KEY = "todo-tracker-items";

  // --- State ---
  let todos = loadTodos();
  let currentFilter = "all";

  // --- DOM refs ---
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const footer = document.getElementById("todo-footer");
  const countEl = document.getElementById("todo-count");
  const clearBtn = document.getElementById("clear-completed");
  const filterBtns = document.querySelectorAll(".filter-btn");

  // --- Persistence ---
  function loadTodos() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }

  // --- Rendering ---
  function render() {
    const filtered = todos.filter(function (todo) {
      if (currentFilter === "active") return !todo.completed;
      if (currentFilter === "completed") return todo.completed;
      return true;
    });

    list.innerHTML = "";

    filtered.forEach(function (todo) {
      const li = document.createElement("li");
      li.className = "todo-item" + (todo.completed ? " completed" : "");
      li.dataset.id = todo.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "todo-checkbox";
      checkbox.checked = todo.completed;
      checkbox.addEventListener("change", function () {
        toggleTodo(todo.id);
      });

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = todo.text;
      span.addEventListener("dblclick", function () {
        startEditing(li, todo);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-delete";
      deleteBtn.innerHTML = "&times;";
      deleteBtn.title = "Delete";
      deleteBtn.addEventListener("click", function () {
        deleteTodo(todo.id);
      });

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });

    updateFooter();
  }

  function updateFooter() {
    var activeCount = todos.filter(function (t) {
      return !t.completed;
    }).length;
    var completedCount = todos.length - activeCount;

    if (todos.length === 0) {
      footer.classList.add("hidden");
    } else {
      footer.classList.remove("hidden");
      countEl.textContent =
        activeCount + " item" + (activeCount !== 1 ? "s" : "") + " left";
      clearBtn.style.display = completedCount > 0 ? "inline" : "none";
    }
  }

  // --- CRUD ---
  function addTodo(text) {
    todos.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text: text,
      completed: false,
    });
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    todos = todos.map(function (t) {
      if (t.id === id) {
        return Object.assign({}, t, { completed: !t.completed });
      }
      return t;
    });
    saveTodos();
    render();
  }

  function deleteTodo(id) {
    todos = todos.filter(function (t) {
      return t.id !== id;
    });
    saveTodos();
    render();
  }

  function editTodo(id, newText) {
    todos = todos.map(function (t) {
      if (t.id === id) {
        return Object.assign({}, t, { text: newText });
      }
      return t;
    });
    saveTodos();
    render();
  }

  function clearCompleted() {
    todos = todos.filter(function (t) {
      return !t.completed;
    });
    saveTodos();
    render();
  }

  // --- Inline editing ---
  function startEditing(li, todo) {
    var textSpan = li.querySelector(".todo-text");
    var editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "todo-text-input";
    editInput.value = todo.text;

    li.replaceChild(editInput, textSpan);
    editInput.focus();

    function finishEdit() {
      var trimmed = editInput.value.trim();
      if (trimmed && trimmed !== todo.text) {
        editTodo(todo.id, trimmed);
      } else {
        render();
      }
    }

    editInput.addEventListener("blur", finishEdit);
    editInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        editInput.blur();
      }
      if (e.key === "Escape") {
        editInput.value = todo.text;
        editInput.blur();
      }
    });
  }

  // --- Event listeners ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (text) {
      addTodo(text);
      input.value = "";
      input.focus();
    }
  });

  clearBtn.addEventListener("click", clearCompleted);

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  // --- Init ---
  render();
})();
