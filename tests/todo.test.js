/**
 * Basic unit tests for todo logic (runs with Node.js, no dependencies).
 */

"use strict";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log("  PASS: " + message);
  } else {
    failed++;
    console.error("  FAIL: " + message);
  }
}

// --- Helpers that mirror app logic ---

function createTodo(text) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    text: text,
    completed: false,
  };
}

function toggleTodo(todos, id) {
  return todos.map(function (t) {
    if (t.id === id) {
      return Object.assign({}, t, { completed: !t.completed });
    }
    return t;
  });
}

function deleteTodo(todos, id) {
  return todos.filter(function (t) {
    return t.id !== id;
  });
}

function editTodo(todos, id, newText) {
  return todos.map(function (t) {
    if (t.id === id) {
      return Object.assign({}, t, { text: newText });
    }
    return t;
  });
}

function clearCompleted(todos) {
  return todos.filter(function (t) {
    return !t.completed;
  });
}

function filterTodos(todos, filter) {
  return todos.filter(function (t) {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });
}

// --- Tests ---

console.log("Creating todos:");
var t1 = createTodo("Buy groceries");
var t2 = createTodo("Walk the dog");
var t3 = createTodo("Read a book");
assert(t1.text === "Buy groceries", "todo has correct text");
assert(t1.completed === false, "todo starts as not completed");
assert(t1.id !== t2.id, "todos have unique ids");

var todos = [t1, t2, t3];

console.log("\nToggling todos:");
todos = toggleTodo(todos, t1.id);
assert(todos[0].completed === true, "first todo is now completed");
assert(todos[1].completed === false, "second todo unchanged");

todos = toggleTodo(todos, t1.id);
assert(todos[0].completed === false, "first todo toggled back to active");

console.log("\nEditing todos:");
todos = editTodo(todos, t2.id, "Walk the cat");
assert(todos[1].text === "Walk the cat", "todo text was updated");

console.log("\nDeleting todos:");
todos = deleteTodo(todos, t3.id);
assert(todos.length === 2, "todo was removed, length is 2");
assert(
  todos.every(function (t) { return t.id !== t3.id; }),
  "deleted todo no longer in list"
);

console.log("\nFiltering todos:");
todos = toggleTodo(todos, t1.id); // mark first as completed
var active = filterTodos(todos, "active");
var completed = filterTodos(todos, "completed");
var all = filterTodos(todos, "all");
assert(active.length === 1, "one active todo");
assert(completed.length === 1, "one completed todo");
assert(all.length === 2, "all filter returns everything");

console.log("\nClearing completed:");
var remaining = clearCompleted(todos);
assert(remaining.length === 1, "completed todos removed");
assert(remaining[0].completed === false, "only active todo remains");

// --- Summary ---
console.log("\n--------------------------");
console.log("Results: " + passed + " passed, " + failed + " failed");
if (failed > 0) {
  process.exit(1);
}
