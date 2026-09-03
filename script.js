const STORAGE_KEY = "grocery-list-items";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

const form = document.getElementById("add-form");
const input = document.getElementById("item-input");
const list = document.getElementById("list");
const emptyMessage = document.getElementById("empty-message");
const fireworksCanvas = document.getElementById("fireworks");

let items = loadItems();
let hasCelebrated = items.length > 0 && items.every((item) => item.checked);

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
  list.innerHTML = "";

  const sorted = [...items].sort((a, b) => a.checked - b.checked);

  for (const item of sorted) {
    const li = document.createElement("li");
    li.className = "list-item" + (item.checked ? " checked" : "");
    li.dataset.id = item.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.checked;
    checkbox.addEventListener("change", () => toggleItem(item.id));

    const span = document.createElement("span");
    span.textContent = item.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", `Remove ${item.text}`);
    deleteBtn.addEventListener("click", () => removeItem(item.id));

    li.append(checkbox, span, deleteBtn);
    list.appendChild(li);
  }

  emptyMessage.hidden = items.length > 0;
}

function addItem(text) {
  items.push({ id: crypto.randomUUID(), text, checked: false });
  hasCelebrated = false;
  saveItems();
  render();
}

function toggleItem(id) {
  const item = items.find((i) => i.id === id);
  if (!item) return;
  item.checked = !item.checked;
  saveItems();
  render();
  checkForCompletion();
}

function removeItem(id) {
  items = items.filter((i) => i.id !== id);
  hasCelebrated = false;
  saveItems();
  render();
}

function checkForCompletion() {
  const allChecked = items.length > 0 && items.every((i) => i.checked);
  if (allChecked && !hasCelebrated) {
    hasCelebrated = true;
    launchFireworks();
  } else if (!allChecked) {
    hasCelebrated = false;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  addItem(text);
  input.value = "";
  input.focus();
});

render();

// ---- Fireworks overlay ----

const ctx = fireworksCanvas.getContext("2d");
let animationId = null;
let hideTimeoutId = null;
let particles = [];

const COLORS = ["#ff595e", "#ffca3a", "#8ac926", "#1982c4", "#6a4c93", "#ff924c"];

function resizeCanvas() {
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}

function createFirework(x, y) {
  const particleCount = 60 + Math.floor(Math.random() * 30);
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      life: 1,
      decay: 0.008 + Math.random() * 0.012,
    });
  }
}

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.05; // gravity
    p.life -= p.decay;

    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
  particles = particles.filter((p) => p.life > 0);

  animationId = requestAnimationFrame(animate);
}

function launchFireworks() {
  resizeCanvas();
  fireworksCanvas.hidden = false;
  particles = [];
  ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  if (animationId) cancelAnimationFrame(animationId);
  animate();

  let bursts = 0;
  const burstInterval = setInterval(() => {
    createFirework(
      fireworksCanvas.width * (0.2 + Math.random() * 0.6),
      fireworksCanvas.height * (0.2 + Math.random() * 0.4)
    );
    bursts++;
    if (bursts >= 8) clearInterval(burstInterval);
  }, 400);

  createFirework(fireworksCanvas.width / 2, fireworksCanvas.height / 3);

  clearTimeout(hideTimeoutId);
  hideTimeoutId = setTimeout(hideFireworks, 5000);
}

function hideFireworks() {
  fireworksCanvas.hidden = true;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
  particles = [];
  clearTimeout(hideTimeoutId);
}

fireworksCanvas.addEventListener("click", hideFireworks);
window.addEventListener("resize", resizeCanvas);
