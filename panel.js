(() => {
  const $ = (id) => document.getElementById(id);

  const DEMO_SECRET = "demo123";

  const K = {
    sessionUnlocked: "jeb_admin_unlocked",
    sessionAt: "jeb_admin_last_active",
    manualMode: "jeb_manual_mode",
    maxOrders: "jeb_max_orders",
    noReplyMin: "jeb_no_reply_min",
    allRefusedMin: "jeb_all_refused_min",
    autoLockMin: "jeb_auto_lock_min",
    compact: "jeb_compact_mode",
  };

  // Toast
  const toastEl = $("toast");
  let toastT = null;
  function toast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    clearTimeout(toastT);
    toastT = setTimeout(() => (toastEl.style.display = "none"), 2200);
  }

  // Session
  const lockEl = $("lock");
  const appEl  = $("app");
  const sessionStateEl = $("sessionState");

  function setAppUnlocked(unlocked){
    lockEl.style.display = unlocked ? "none" : "flex";
    appEl.setAttribute("aria-hidden", unlocked ? "false" : "true");
    sessionStateEl.textContent = unlocked ? "Unlocked ✅" : "Locked";
  }

  function nowMs(){ return Date.now(); }
  function getAutoLockMs(){
    const m = Number(localStorage.getItem(K.autoLockMin) || 10);
    return Math.max(1, m) * 60 * 1000;
  }
  function isUnlocked(){ return localStorage.getItem(K.sessionUnlocked) === "1"; }
  function markActive(){ localStorage.setItem(K.sessionAt, String(nowMs())); }

  function lock(){
    localStorage.setItem(K.sessionUnlocked, "0");
    setAppUnlocked(false);
    toast("Locked");
  }

  function unlockWithSecret(secret){
    if (String(secret || "").trim() !== DEMO_SECRET){
      toast("Wrong secret (prototype)");
      return false;
    }
    localStorage.setItem(K.sessionUnlocked, "1");
    markActive();
    setAppUnlocked(true);
    toast("Unlocked");
    return true;
  }

  function autoLockTick(){
    if (!isUnlocked()) return;
    const last = Number(localStorage.getItem(K.sessionAt) || 0);
    if (!last) return;
    if (nowMs() - last > getAutoLockMs()) lock();
  }
  setInterval(autoLockTick, 2000);

  ["click","keydown","touchstart","scroll"].forEach((ev) => {
    window.addEventListener(ev, () => { if (isUnlocked()) markActive(); }, { passive:true });
  });

  $("unlockBtn").onclick = () => unlockWithSecret($("secretInput").value);
  $("demoBtn").onclick = () => {
    $("secretInput").value = DEMO_SECRET;
    unlockWithSecret(DEMO_SECRET);
  };
  $("lockBtn").onclick = lock;

  $("clearSessionBtn").onclick = () => {
    localStorage.setItem(K.sessionUnlocked, "0");
    localStorage.removeItem(K.sessionAt);
    toast("Session cleared");
    setAppUnlocked(false);
  };

  // Compact
  function applyCompact(){
    const on = localStorage.getItem(K.compact) === "1";
    document.body.classList.toggle("compact", on);
    $("compactBtn").textContent = on ? "Normal" : "Compact";
  }
  $("compactBtn").onclick = () => {
    const on = localStorage.getItem(K.compact) === "1";
    localStorage.setItem(K.compact, on ? "0" : "1");
    applyCompact();
  };

  // Tabs
  const sections = ["orders","chat","drivers","settings","maps"];
  document.querySelectorAll(".tab").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const t = b.dataset.tab;
      sections.forEach((id) => $(id).classList.toggle("hidden", id !== t));
      if (t === "orders") loadOrders();
      if (t === "drivers") loadDrivers();
      if (t === "chat") loadChatsAll();
      if (t === "settings") loadSettingsUI();
    };
  });

  // Mock state
  const S = {
    orderTab: "ACTIVE",
    activeChat: null,
    dir: "ltr",
    activeOrderId: null,
    orders: [
      { id:"0412", name:"Ahmad", status:"ASSIGNED", driver:"112233", price:70000, updatedAt: Date.now()- 5*60*1000, address:"Hamra", request:"2 man2oushe" },
      { id:"5180", name:"Maya", status:"PRICE_UPDATE_PENDING", driver:"112233", price:70000, pendingPrice:90000, updatedAt: Date.now()- 2*60*1000, address:"Achrafieh", request:"Pharmacy pickup" },
      { id:"9001", name:"Rami", status:"WAITING_FOR_DRIVER", driver:null, price:70000, updatedAt: Date.now()- 12*60*1000, address:"Verdun", request:"Groceries" },
      { id:"1337", name:"Lina", status:"REASSIGNED", driver:null, price:80000, updatedAt: Date.now()- 22*60*1000, address:"Mar Mkhael", request:"Food order" },
      { id:"7777", name:"Omar", status:"COMPLETED", driver:"998877", price:65000, updatedAt: Date.now()- 3*60*60*1000, address:"Jnah", request:"Delivery" },
      { id:"6666", name:"Sara", status:"CANCELED_BY_OFFICE", driver:null, price:70000, updatedAt: Date.now()- 26*60*60*1000, address:"Dbayeh", request:"Canceled" },
    ],
    drivers: [
      { name:"Fadi", chat:"112233", user:"@fadi", approved:true, active:true, archived:false },
      { name:"Hussein", chat:"998877", user:"@hus", approved:true, active:true, archived:false },
      { name:"Ali", chat:"445566", user:"-", approved:false, active:false, archived:false },
      { name:"Old Driver", chat:"101010", user:"-", approved:false, active:false, archived:true },
    ],
    // chats for ANY status orders
    chats: {
      "0412": [
        { dir:"in",  text:"Where is the driver?", ts: Date.now()- 18*60*1000 },
        { dir:"out", text:"On the way, 5 minutes.", ts: Date.now()- 16*60*1000 },
      ],
      "5180": [
        { dir:"in",  text:"How much is it now?", ts: Date.now()- 10*60*1000 },
        { dir:"out", text:"Price update pending admin approval.", ts: Date.now()- 9*60*1000 },
      ],
      "7777": [
        { dir:"in",  text:"Thanks 🙏", ts: Date.now()- 3*60*60*1000 + 4*60*1000 },
        { dir:"out", text:"You’re welcome!", ts: Date.now()- 3*60*60*1000 + 3*60*1000 },
      ],
      "6666": [
        { dir:"in",  text:"Cancel please", ts: Date.now()- 26*60*60*1000 + 8*60*1000 },
      ],
    }
  };

  function fmt(ts){
    const d = new Date(ts);
    return d.toLocaleString([], { hour:"2-digit", minute:"2-digit" });
  }
  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function badgeForStatus(st){
    const s = String(st);
    if (s === "PRICE_UPDATE_PENDING") return `<span class="badge warn">PRICE PENDING</span>`;
    if (s === "ASSIGNED" || s === "IN_PROGRESS") return `<span class="badge ok">${s}</span>`;
    if (s === "WAITING_FOR_DRIVER" || s === "REASSIGNED") return `<span class="badge warn">${s}</span>`;
    if (s === "COMPLETED") return `<span class="badge ok">COMPLETED</span>`;
    if (s.startsWith("CANCELED")) return `<span class="badge danger">CANCELED</span>`;
    return `<span class="badge">${s}</span>`;
  }

  function driverNameByChatId(chatId){
    if (!chatId) return null;
    const d = S.drivers.find(x => String(x.chat) === String(chatId));
    return d?.name || null;
  }

  // ===== Order details drawer (injected) =====
  function ensureDrawer(){
    if (document.getElementById("drawerOverlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "drawerOverlay";
    overlay.className = "drawerOverlay";
    overlay.onclick = closeDrawer;

    const drawer = document.createElement("div");
    drawer.id = "orderDrawer";
    drawer.className = "drawer";
    drawer.innerHTML = `
      <div class="drawerHead">
        <div>
          <div class="card-title" id="drawerTitle">Order</div>
          <div class="muted small" id="drawerSub">—</div>
        </div>
        <button class="btn" id="drawerCloseBtn">Close</button>
      </div>

      <div class="drawerBody" id="drawerBody"></div>

      <div class="drawerFooter">
        <button class="btn" id="drawerOpenChat">Open Chat</button>
        <button class="btn danger" id="drawerCancel">Cancel Order</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    document.getElementById("drawerCloseBtn").onclick = closeDrawer;
    document.getElementById("drawerOpenChat").onclick = () => {
      if (!S.activeOrderId) return;
      openChatForOrder(S.activeOrderId);
      // switch to chat tab
      document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === "chat"));
      sections.forEach((sid) => $(sid).classList.toggle("hidden", sid !== "chat"));
    };
    document.getElementById("drawerCancel").onclick = () => toast("Cancel (prototype)");
  }

  function openDrawer(orderId){
    ensureDrawer();
    const overlay = document.getElementById("drawerOverlay");
    const drawer = document.getElementById("orderDrawer");
    const body = document.getElementById("drawerBody");

    const o = S.orders.find(x => x.id === orderId);
    if (!o) return;

    S.activeOrderId = orderId;

    const drvName = driverNameByChatId(o.driver);
    const drvLine = o.driver ? `${drvName ? drvName + " • " : ""}${o.driver}` : "—";

    document.getElementById("drawerTitle").textContent = `Order #${o.id}`;
    document.getElementById("drawerSub").textContent = `${o.name || "Customer"} • ${o.status}`;

    body.innerHTML = `
      <div class="kv"><div class="k">Customer</div><div class="v">${escapeHtml(o.name || "-")}</div></div>
      <div class="kv"><div class="k">Status</div><div class="v">${badgeForStatus(o.status)}</div></div>
      <div class="kv"><div class="k">Driver</div><div class="v">${escapeHtml(drvLine)}</div></div>
      <div class="kv"><div class="k">Address</div><div class="v">${escapeHtml(o.address || "-")}</div></div>
      <div class="kv"><div class="k">Request</div><div class="v">${escapeHtml(o.request || "-")}</div></div>
      <div class="kv"><div class="k">Price</div><div class="v">${Number(o.price || 0).toLocaleString("en-US")} L.L</div></div>
      ${
        o.pendingPrice ? `<div class="kv"><div class="k">Pending Price</div><div class="v">${Number(o.pendingPrice).toLocaleString("en-US")} L.L</div></div>` : ``
      }
      <div class="kv"><div class="k">Updated</div><div class="v">${escapeHtml(fmt(o.updatedAt))}</div></div>
    `;

    overlay.classList.add("show");
    drawer.classList.add("show");
  }

  function closeDrawer(){
    const overlay = document.getElementById("drawerOverlay");
    const drawer = document.getElementById("orderDrawer");
    overlay?.classList.remove("show");
    drawer?.classList.remove("show");
  }

  // ===== Orders =====
  document.querySelectorAll(".subtab").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll(".subtab").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      S.orderTab = b.dataset.otab;
      loadOrders();
    };
  });
  $("refreshOrders").onclick = () => loadOrders();
  $("refreshPriceReq").onclick = () => loadPriceRequests();

  function tabFilter(tab, st){
    const s = String(st);
    if (tab === "ACTIVE") return ["ASSIGNED","IN_PROGRESS","PRICE_UPDATE_PENDING"].includes(s);
    if (tab === "WAITING") return ["WAITING_FOR_DRIVER","REASSIGNED"].includes(s);
    if (tab === "COMPLETED") return s === "COMPLETED";
    if (tab === "CANCELED") return s.startsWith("CANCELED");
    return true;
  }

  function loadOrders(){
    const q = String($("orderSearch").value || "").trim().toLowerCase();
    const rows = S.orders
      .filter(o => tabFilter(S.orderTab, o.status))
      .filter(o => !q || o.id.includes(q) || String(o.name||"").toLowerCase().includes(q))
      .sort((a,b) => b.updatedAt - a.updatedAt)
      .slice(0, 200);

    $("ordersTable").innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Driver</th>
            <th>Price</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.length ? rows.map(o => {
              const drvName = driverNameByChatId(o.driver);
              const drvText = o.driver ? `${drvName ? drvName : "Driver"} (${o.driver})` : "—";
              const shownPrice = Number(o.pendingPrice || o.price || 0).toLocaleString("en-US");
              return `
                <tr data-oid="${o.id}" class="rowClick">
                  <td><b>#${o.id}</b><div class="muted small">${escapeHtml(o.name || "-")}</div></td>
                  <td>${badgeForStatus(o.status)}</td>
                  <td>${o.driver ? `<div><b>${escapeHtml(drvName || "Driver")}</b></div><div class="muted small"><code>${escapeHtml(o.driver)}</code></div>` : `<span class="muted">—</span>`}</td>
                  <td>${shownPrice} L.L</td>
                  <td>${escapeHtml(fmt(o.updatedAt))}</td>
                </tr>
              `;
            }).join("") : `<tr><td colspan="5" class="muted">No orders</td></tr>`
          }
        </tbody>
      </table>
    `;

    // click row -> open details drawer (NOT chat)
    document.querySelectorAll(".rowClick").forEach((tr) => {
      tr.onclick = () => openDrawer(tr.getAttribute("data-oid"));
    });

    loadPriceRequests();
  }

  function loadPriceRequests(){
    const rows = S.orders
      .filter(o => o.status === "PRICE_UPDATE_PENDING" && o.pendingPrice)
      .sort((a,b) => b.updatedAt - a.updatedAt);

    $("priceReqList").innerHTML = rows.length ? rows.map(o => {
      const drvName = driverNameByChatId(o.driver);
      return `
        <div class="priceReqItem">
          <div class="priceReqTop">
            <div>
              <div class="priceReqTitle">#${o.id} • ${escapeHtml(o.name || "Customer")}</div>
              <div class="muted small">Driver: ${escapeHtml(drvName || "Driver")} ${o.driver ? `(${o.driver})` : ""} • Updated: ${escapeHtml(fmt(o.updatedAt))}</div>
            </div>
            <div class="badge warn">PENDING</div>
          </div>

          <div style="margin-top:10px">
            <div class="muted small">Current</div>
            <div><b>${Number(o.price).toLocaleString("en-US")} L.L</b></div>
          </div>

          <div style="margin-top:10px">
            <div class="muted small">Requested</div>
            <div><b>${Number(o.pendingPrice).toLocaleString("en-US")} L.L</b></div>
          </div>

          <div class="priceReqBtns" style="margin-top:10px">
            <button class="btn primary" onclick="window.__approvePrice('${o.id}')">Approve</button>
            <button class="btn" onclick="window.__rejectKeep('${o.id}')">Reject (Keep)</button>
            <button class="btn danger" onclick="window.__setPrice('${o.id}')">Set Final</button>
            <button class="btn" onclick="window.__openDetails('${o.id}')">Details</button>
          </div>

          <div class="muted small" style="margin-top:8px">
            Prototype only: buttons will call Core endpoints later.
          </div>
        </div>
      `;
    }).join("") : `<div class="muted">No pending price updates.</div>`;
  }

  window.__openDetails = (id) => openDrawer(id);

  // mock price actions
  window.__approvePrice = (id) => {
    const o = S.orders.find(x => x.id === id);
    if (!o) return;
    o.price = o.pendingPrice;
    o.pendingPrice = null;
    o.status = "ASSIGNED";
    o.updatedAt = Date.now();
    toast(`Approved #${id}`);
    loadOrders();
  };
  window.__rejectKeep = (id) => {
    const o = S.orders.find(x => x.id === id);
    if (!o) return;
    o.pendingPrice = null;
    o.status = "ASSIGNED";
    o.updatedAt = Date.now();
    toast(`Rejected #${id} (kept old price)`);
    loadOrders();
  };
  window.__setPrice = (id) => {
    const o = S.orders.find(x => x.id === id);
    if (!o) return;
    const v = prompt("Final price (L.L)", String(o.pendingPrice || o.price));
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return toast("Invalid price");
    o.price = n;
    o.pendingPrice = null;
    o.status = "ASSIGNED";
    o.updatedAt = Date.now();
    toast(`Set final price for #${id}`);
    loadOrders();
  };

  // Quick actions (remove open chat here)
  $("createManualOrderBtn").onclick = () => toast("Manual Order UI (next step)");
  $("cancelOrderBtn").onclick = () => toast("Cancel UI (next step)");

  // ===== Chat (ALL chats, not only active orders) =====
  $("refreshChats").onclick = () => loadChatsAll();
  $("sendBtn").onclick = () => sendChat();
  $("rtlBtn").onclick = () => setDir("rtl");
  $("ltrBtn").onclick = () => setDir("ltr");

  function setDir(dir){
    S.dir = dir;
    document.documentElement.dir = dir;
    document.documentElement.lang = dir === "rtl" ? "ar" : "en";
  }

  function buildAllChatsIndex(){
    // include chats for any order status + allow orders with no chat (optional)
    const chatOrderIds = new Set(Object.keys(S.chats || {}));
    const list = [];

    // 1) orders with chats
    for (const id of chatOrderIds){
      const o = S.orders.find(x => x.id === id);
      const msgs = S.chats[id] || [];
      const lastMsg = msgs[msgs.length-1];
      const ts = lastMsg?.ts || o?.updatedAt || Date.now();
      list.push({
        id,
        name: o?.name || "Customer",
        status: o?.status || "—",
        last: lastMsg?.text || "",
        ts
      });
    }

    // 2) (optional) orders without chats -> still show as “No messages yet”
    for (const o of S.orders){
      if (chatOrderIds.has(o.id)) continue;
      list.push({
        id: o.id,
        name: o.name || "Customer",
        status: o.status,
        last: "No messages yet",
        ts: o.updatedAt || Date.now()
      });
    }

    return list.sort((a,b) => b.ts - a.ts);
  }

  function loadChatsAll(){
    const q = String($("chatSearch").value || "").trim().toLowerCase();
    const list = buildAllChatsIndex()
      .filter(x => !q || x.id.includes(q) || String(x.name||"").toLowerCase().includes(q));

    $("chatList").innerHTML = list.length ? list.map(x => `
      <div class="chatItem ${S.activeChat===x.id?'active':''}" data-oid="${x.id}">
        <div class="av">${(x.name||"J").trim().slice(0,1).toUpperCase()}</div>
        <div class="meta">
          <div class="t">#${escapeHtml(x.id)} • ${escapeHtml(x.name || "Customer")}</div>
          <div class="s">${escapeHtml(x.last || "—")}</div>
        </div>
        <div class="r">${escapeHtml(fmt(x.ts))}</div>
      </div>
    `).join("") : `<div class="muted">No chats.</div>`;

    document.querySelectorAll(".chatItem").forEach((el) => {
      el.onclick = () => openChatForOrder(el.getAttribute("data-oid"));
    });

    $("chatSearch").oninput = () => loadChatsAll();
  }

  function openChatForOrder(orderId){
    S.activeChat = orderId;

    const o = S.orders.find(x => x.id === orderId);
    const title = o ? `#${o.id} • ${o.name || "Customer"}` : `#${orderId}`;
    $("chatTitle").textContent = title;
    $("chatSub").textContent = o ? `Status: ${o.status}` : "—";
    $("chatAvatar").textContent = (o?.name || "J").trim().slice(0,1).toUpperCase();

    renderChat();
    loadChatsAll();
  }

  function renderChat(){
    if (!S.activeChat){
      $("messages").innerHTML = `<div class="empty muted">Pick an order chat from the left.</div>`;
      return;
    }
    const msgs = S.chats[S.activeChat] || [];
    $("messages").innerHTML = msgs.length ? msgs.map(m => `
      <div class="bubbleRow ${m.dir}">
        <div class="bubble ${m.dir==='out'?'out':''}">
          <div>${escapeHtml(m.text)}</div>
          <div class="bmeta">${escapeHtml(fmt(m.ts))}</div>
        </div>
      </div>
    `).join("") : `<div class="empty muted">No messages yet.</div>`;

    const el = $("messages");
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight + 9999; });
  }

  function sendChat(){
    if (!S.activeChat) return toast("Select a chat first");
    const input = $("msgInput");
    const text = String(input.value || "").trim();
    if (!text) return;
    input.value = "";
    const arr = S.chats[S.activeChat] || (S.chats[S.activeChat] = []);
    arr.push({ dir:"out", text, ts: Date.now() });
    renderChat();
    toast("Sent (prototype)");
  }

  // ===== Drivers =====
  $("refreshDrivers").onclick = () => loadDrivers();
  $("driversScope").onchange = () => loadDrivers();

  const addModal = $("addDriverModal");
  function showModal(id){ $(id).classList.add("show"); }
  function hideModal(id){ $(id).classList.remove("show"); }

  $("addDriverBtn").onclick = () => showModal("addDriverModal");
  $("closeDriverModal").onclick = () => hideModal("addDriverModal");
  addModal.querySelector(".modal-overlay").onclick = () => hideModal("addDriverModal");

  $("saveDriverBtn").onclick = () => {
    const name = $("drvName").value.trim() || "Driver";
    const chat = $("drvChatId").value.trim();
    const user = $("drvUser").value.trim() || "-";
    if (!chat) return toast("Chat ID required");
    S.drivers.unshift({ name, chat, user, approved:true, active:true, archived:false });
    $("drvName").value=""; $("drvChatId").value=""; $("drvUser").value="";
    hideModal("addDriverModal");
    toast("Driver added (prototype)");
    loadDrivers();
    loadOrders(); // refresh driver names in orders
    loadPriceRequests();
  };

  window.__driverToggle = (chat, enable) => {
    const d = S.drivers.find(x => x.chat === String(chat));
    if (!d) return;
    d.active = !!enable;
    d.archived = false;
    toast(enable ? "Enabled" : "Disabled");
    loadDrivers();
    loadOrders();
  };
  window.__driverArchive = (chat) => {
    const d = S.drivers.find(x => x.chat === String(chat));
    if (!d) return;
    d.active = false;
    d.approved = false;
    d.archived = true;
    toast("Archived");
    loadDrivers();
    loadOrders();
  };

  function loadDrivers(){
    const scope = String($("driversScope").value || "all");
    let rows = S.drivers.slice();

    if (scope === "active") rows = rows.filter(d => d.active && !d.archived);
    if (scope === "off") rows = rows.filter(d => !d.active && !d.archived);
    if (scope === "archived") rows = rows.filter(d => d.archived);

    $("driversTable").innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Chat ID</th>
            <th>User</th>
            <th>Approved</th>
            <th>Status</th>
            <th style="width:320px">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.length ? rows.map(d => {
              const status = d.archived ? `<span class="badge danger">ARCHIVED</span>` :
                            d.active ? `<span class="badge ok">ACTIVE</span>` :
                            `<span class="badge warn">OFF</span>`;
              return `
                <tr>
                  <td><b>${escapeHtml(d.name || "-")}</b></td>
                  <td><code>${escapeHtml(d.chat)}</code></td>
                  <td>${escapeHtml(d.user || "-")}</td>
                  <td>${d.approved ? "✅" : "⏳"}</td>
                  <td>${status}</td>
                  <td>
                    ${
                      d.archived ? `
                        <button class="btn primary" onclick="window.__driverToggle('${d.chat}', true)">Restore</button>
                      ` : d.active ? `
                        <button class="btn danger" onclick="window.__driverToggle('${d.chat}', false)">Disable</button>
                      ` : `
                        <button class="btn primary" onclick="window.__driverToggle('${d.chat}', true)">Enable</button>
                      `
                    }
                    ${!d.archived ? `<button class="btn" onclick="window.__driverArchive('${d.chat}')">Archive</button>` : ``}
                  </td>
                </tr>
              `;
            }).join("") : `<tr><td colspan="6" class="muted">No drivers</td></tr>`
          }
        </tbody>
      </table>
    `;
  }

  // Invites UI only
  $("genInviteBtn").onclick = () => {
    const ttl = Math.max(5, Number($("inviteTtl").value || 1440));
    const code = "INV_" + Math.random().toString(16).slice(2,10).toUpperCase();
    const exp = new Date(Date.now() + ttl*60*1000).toLocaleString();
    $("inviteBox").innerHTML = `
      <div><b>Invite Code:</b> <code>${code}</code></div>
      <div class="muted">Single-use • Expires: ${exp}</div>
    `;
    toast("Invite generated (prototype)");
  };

  // ===== Settings =====
  function loadSettingsUI(){
    $("manualMode").checked = localStorage.getItem(K.manualMode) === "1";
    $("maxOrders").value = localStorage.getItem(K.maxOrders) || "3";
    $("noReplyMin").value = localStorage.getItem(K.noReplyMin) || "3";
    $("allRefusedMin").value = localStorage.getItem(K.allRefusedMin) || "5";
    $("autoLockMin").value = localStorage.getItem(K.autoLockMin) || "10";
  }

  $("saveSettings").onclick = () => {
    localStorage.setItem(K.manualMode, $("manualMode").checked ? "1" : "0");
    localStorage.setItem(K.maxOrders, String(Math.max(1, Number($("maxOrders").value || 3))));
    localStorage.setItem(K.noReplyMin, String(Math.max(1, Number($("noReplyMin").value || 3))));
    localStorage.setItem(K.allRefusedMin, String(Math.max(1, Number($("allRefusedMin").value || 5))));
    localStorage.setItem(K.autoLockMin, String(Math.max(1, Number($("autoLockMin").value || 10))));
    toast("Saved");
  };

  $("resetSettings").onclick = () => {
    localStorage.removeItem(K.manualMode);
    localStorage.removeItem(K.maxOrders);
    localStorage.removeItem(K.noReplyMin);
    localStorage.removeItem(K.allRefusedMin);
    localStorage.removeItem(K.autoLockMin);
    loadSettingsUI();
    toast("Reset");
  };

  // ===== Init =====
  applyCompact();
  setDir("ltr"); // English default

  if (isUnlocked()) {
    setAppUnlocked(true);
    markActive();
  } else {
    setAppUnlocked(false);
  }

  if (isUnlocked()){
    loadOrders();
    loadDrivers();
    loadChatsAll();
    loadSettingsUI();
  }
})();
