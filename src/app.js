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

      var handle = document.createElement("span");
      handle.className = "drag-handle";
      handle.innerHTML = "&#x2630;";
      handle.title = "Drag to reorder";

      li.draggable = true;
      li.addEventListener("dragstart", onDragStart);
      li.addEventListener("dragend", onDragEnd);
      li.addEventListener("dragover", onDragOver);
      li.addEventListener("dragenter", onDragEnter);
      li.addEventListener("dragleave", onDragLeave);
      li.addEventListener("drop", onDrop);

      // Touch support
      handle.addEventListener("touchstart", onTouchStart, { passive: false });

      li.appendChild(handle);
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

  // --- Drag and drop ---
  var draggedId = null;

  function onDragStart(e) {
    draggedId = this.dataset.id;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragEnd() {
    this.classList.remove("dragging");
    list.querySelectorAll(".drag-over").forEach(function (el) {
      el.classList.remove("drag-over");
    });
    draggedId = null;
  }

  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onDragEnter(e) {
    e.preventDefault();
    if (this.dataset.id !== draggedId) {
      this.classList.add("drag-over");
    }
  }

  function onDragLeave() {
    this.classList.remove("drag-over");
  }

  function onDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");
    var targetId = this.dataset.id;
    if (draggedId && draggedId !== targetId) {
      reorderTodos(draggedId, targetId);
    }
  }

  function reorderTodos(fromId, toId) {
    var fromIndex = todos.findIndex(function (t) { return t.id === fromId; });
    var toIndex = todos.findIndex(function (t) { return t.id === toId; });
    if (fromIndex === -1 || toIndex === -1) return;
    var item = todos.splice(fromIndex, 1)[0];
    todos.splice(toIndex, 0, item);
    saveTodos();
    render();
  }

  // --- Touch drag support ---
  var touchDragEl = null;
  var touchClone = null;
  var touchStartY = 0;

  function onTouchStart(e) {
    e.preventDefault();
    var li = this.closest(".todo-item");
    touchDragEl = li;
    draggedId = li.dataset.id;
    touchStartY = e.touches[0].clientY;

    touchClone = li.cloneNode(true);
    touchClone.style.position = "fixed";
    touchClone.style.zIndex = "1000";
    touchClone.style.width = li.offsetWidth + "px";
    touchClone.style.opacity = "0.85";
    touchClone.style.pointerEvents = "none";
    touchClone.style.left = li.getBoundingClientRect().left + "px";
    touchClone.style.top = li.getBoundingClientRect().top + "px";
    document.body.appendChild(touchClone);

    li.classList.add("dragging");

    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
  }

  function onTouchMove(e) {
    e.preventDefault();
    var touch = e.touches[0];
    if (touchClone) {
      touchClone.style.top = touch.clientY - 20 + "px";
    }

    var target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target) {
      var targetLi = target.closest(".todo-item");
      list.querySelectorAll(".drag-over").forEach(function (el) {
        el.classList.remove("drag-over");
      });
      if (targetLi && targetLi.dataset.id !== draggedId) {
        targetLi.classList.add("drag-over");
      }
    }
  }

  function onTouchEnd(e) {
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("touchend", onTouchEnd);

    var touch = e.changedTouches[0];
    var target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target) {
      var targetLi = target.closest(".todo-item");
      if (targetLi && draggedId && targetLi.dataset.id !== draggedId) {
        reorderTodos(draggedId, targetLi.dataset.id);
      }
    }

    if (touchDragEl) touchDragEl.classList.remove("dragging");
    if (touchClone) touchClone.remove();
    list.querySelectorAll(".drag-over").forEach(function (el) {
      el.classList.remove("drag-over");
    });
    touchDragEl = null;
    touchClone = null;
    draggedId = null;
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
