// --- Mock data (بعدين نوصلها بباكندك عبر API) ---
let orders = [
  { id: "1001", customerName: "Ali", phone: "70xxxxxx", status: "WAITING", createdAt: Date.now() - 2 * 60000 },
  { id: "1002", customerName: "Sara", phone: "71xxxxxx", status: "ACTIVE", driverName: "Hassan", createdAt: Date.now() - 6 * 60000 }
];

let drivers = [
  { id: "d1", name: "Hassan", enabled: true, online: true, activeOrders: 1 },
  { id: "d2", name: "Omar", enabled: true, online: false, activeOrders: 0 }
];

// --- UI helpers ---
const $ = (id) => document.getElementById(id);
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => [...document.querySelectorAll(sel)];

function minutesSince(ms) {
  return Math.max(0, Math.floor((Date.now() - ms) / 60000));
}

function slaEmoji(age) {
  if (age < 3) return "🟢";
  if (age < 5) return "🟡";
  return "🔴";
}

// --- Tabs ---
qsa(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    qsa(".tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    ["orders","drivers","manual","system"].forEach(id => $(id).classList.add("hidden"));
    $(tab).classList.remove("hidden");
  });
});

// --- Orders subtabs ---
let currentStatus = "WAITING";
qsa(".subtab").forEach(btn => {
  btn.addEventListener("click", () => {
    qsa(".subtab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentStatus = btn.dataset.status;
    renderOrders();
  });
});

$("orderSearch").addEventListener("input", renderOrders);

function renderOrders() {
  const list = $("ordersList");
  const query = $("orderSearch").value.trim().toLowerCase();

  const filtered = orders
    .filter(o => o.status === currentStatus)
    .filter(o => {
      if (!query) return true;
      return (
        o.id.toLowerCase().includes(query) ||
        (o.customerName || "").toLowerCase().includes(query) ||
        (o.phone || "").toLowerCase().includes(query) ||
        (o.driverName || "").toLowerCase().includes(query)
      );
    });

  list.innerHTML = filtered.map(o => {
    const age = minutesSince(o.createdAt);
    return `
      <div class="card">
        <div>
          <div class="title">${slaEmoji(age)} #${o.id} — ${o.customerName} (${o.phone})</div>
          <div class="meta">Driver: ${o.driverName ?? "—"} • Age: ${age} min</div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn" onclick="redispatch('${o.id}')">Force Redispatch</button>
          <button class="btn danger" onclick="cancelOrder('${o.id}')">Cancel</button>
        </div>
      </div>
    `;
  }).join("") || `<div class="muted">No orders here.</div>`;
}

window.redispatch = (id) => {
  alert("Redispatch triggered for " + id + " (mock)");
};

window.cancelOrder = (id) => {
  orders = orders.map(o => o.id === id ? { ...o, status: "CANCELED" } : o);
  renderOrders();
};

// --- Drivers ---
$("addDriver").addEventListener("click", () => {
  const name = $("driverName").value.trim();
  if (!name) return;
  drivers.unshift({ id: "d" + Math.floor(Math.random()*1000), name, enabled: true, online: false, activeOrders: 0 });
  $("driverName").value = "";
  renderDrivers();
});

function renderDrivers() {
  const list = $("driversList");
  list.innerHTML = drivers.map(d => `
    <div class="card">
      <div>
        <div class="title">${d.name} ${d.enabled ? "✅" : "⛔"} ${d.online ? "🟢" : "⚪"}</div>
        <div class="meta">Active orders: ${d.activeOrders} / 3</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn" onclick="toggleEnabled('${d.id}')">${d.enabled ? "Disable" : "Enable"}</button>
        <button class="btn" onclick="toggleOnline('${d.id}')">${d.online ? "Set Offline" : "Set Online"}</button>
      </div>
    </div>
  `).join("") || `<div class="muted">No drivers yet.</div>`;
}

window.toggleEnabled = (id) => {
  drivers = drivers.map(d => d.id === id ? { ...d, enabled: !d.enabled } : d);
  renderDrivers();
};

window.toggleOnline = (id) => {
  drivers = drivers.map(d => d.id === id ? { ...d, online: !d.online } : d);
  renderDrivers();
};

// --- Manual order ---
$("hasReq").addEventListener("change", (e) => {
  $("reqText").classList.toggle("hidden", !e.target.checked);
});

$("createOrder").addEventListener("click", () => {
  const customerName = $("cName").value.trim();
  const phone = $("cPhone").value.trim();
  const pickup = $("pickup").value.trim();
  const dropoff = $("dropoff").value.trim();
  const req = $("hasReq").checked ? $("reqText").value.trim() : "";

  if (!customerName || !phone || !pickup || !dropoff) {
    return alert("Fill all required fields");
  }

  const id = String(Math.floor(1000 + Math.random() * 9000));
  orders.unshift({
    id,
    customerName,
    phone,
    pickup,
    dropoff,
    requestText: req,
    status: "WAITING",
    createdAt: Date.now()
  });

  $("cName").value = "";
  $("cPhone").value = "";
  $("pickup").value = "";
  $("dropoff").value = "";
  $("hasReq").checked = false;
  $("reqText").value = "";
  $("reqText").classList.add("hidden");

  alert("Order created (mock) ✅");
  // يرجع للأوردرز
  qs('.tab[data-tab="orders"]').click();
  qs('.subtab[data-status="WAITING"]').click();
});

// --- System reset ---
$("resetBtn").addEventListener("click", () => {
  const reason = $("resetReason").value.trim();
  if (!reason) return alert("Enter a reason");
  const ok = confirm("Are you sure? This will reset the system.");
  if (!ok) return;

  // mock reset: cancel غير المكتمل
  orders = orders.map(o => (o.status === "COMPLETED" || o.status === "CANCELED") ? o : { ...o, status: "CANCELED" });
  $("resetReason").value = "";
  alert("System reset done (mock). Reason: " + reason);
  renderOrders();
});

// init
renderOrders();
renderDrivers();

// theme button (simple toggle)
let dark = true;
$("theme").addEventListener("click", () => {
  dark = !dark;
  document.documentElement.style.setProperty("--bg", dark ? "#0b0f17" : "#f6f7fb");
  document.documentElement.style.setProperty("--card", dark ? "#121a27" : "#ffffff");
  document.documentElement.style.setProperty("--text", dark ? "#eef2ff" : "#0b0f17");
  document.documentElement.style.setProperty("--muted", dark ? "#9aa7bd" : "#5b677a");
  document.documentElement.style.setProperty("--border", dark ? "#22324d" : "#e5e7eb");
  document.documentElement.style.setProperty("--btn", dark ? "#1b2740" : "#f1f5f9");
  document.documentElement.style.setProperty("--btn2", dark ? "#0f172a" : "#ffffff");
  $("theme").textContent = dark ? "🌙" : "☀️";
});
