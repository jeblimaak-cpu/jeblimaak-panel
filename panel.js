(() => {
  const $ = (id) => document.getElementById(id);

  // ===== Demo secret =====
  const DEMO_SECRET = "demo123";

  // ===== Storage keys =====
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

  // ===== UI: toast =====
  const toastEl = $("toast");
  let toastT = null;
  function toast(msg){
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.style.display = "block";
    clearTimeout(toastT);
    toastT = setTimeout(() => (toastEl.style.display = "none"), 2200);
  }

  // ===== Session lock/unlock =====
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

  function isUnlocked(){
    return localStorage.getItem(K.sessionUnlocked) === "1";
  }

  function markActive(){
    localStorage.setItem(K.sessionAt, String(nowMs()));
  }

  function lock(){
    localStorage.setItem(K.sessionUnlocked, "0");
    setAppUnlocked(false);
    toast("Locked");
  }

  function unlockWithSecret(secret){
    // prototype check
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

  // auto-lock timer
  function autoLockTick(){
    if (!isUnlocked()) return;
    const last = Number(localStorage.getItem(K.sessionAt) || 0);
    if (!last) return;
    if (nowMs() - last > getAutoLockMs()){
      lock();
    }
  }
  setInterval(autoLockTick, 2000);

  // activity listeners
  ["click","keydown","touchstart","mousemove","scroll"].forEach((ev) => {
    window.addEventListener(ev, () => {
      if (isUnlocked()) markActive();
    }, { passive: true });
  });

  // unlock UI
  $("unlockBtn").onclick = () => {
    const v = $("secretInput").value;
    unlockWithSecret(v);
  };
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

  // ===== Compact mode =====
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

  // ===== Tabs =====
  const sections = ["orders","chat","drivers","settings","maps"];
  document.querySelectorAll(".tab").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      const t = b.dataset.tab;
      sections.forEach((id) => $(id).classList.toggle("hidden", id !== t));
      // on open
      if (t === "orders") loadOrders();
      if (t === "drivers") loadDrivers();
      if (t === "chat") loadChats();
      if (t === "settings") loadSettingsUI();
    };
  });

  // ===== Mock data (UI only) =====
  const S = {
    orderTab: "ACTIVE",
    activeChat: null,
    dir: "ltr",
    // pretend DB
    orders: [
      { id:"0412", name:"Ahmad", status:"ASSIGNED", driver:"112233", price:70000, updatedAt: Date.now()- 5*60*1000 },
      { id:"5180", name:"Maya", status:"PRICE_UPDATE_PENDING", driver:"112233", price:70000, pendingPrice:90000, updatedAt: Date.now()- 2*60*1000 },
      { id:"9001", name:"Rami", status:"WAITING_FOR_DRIVER", driver:null, price:70000, updatedAt: Date.now()- 12*60*1000 },
      { id:"1337", name:"Lina", status:"REASSIGNED", driver:null, price:80000, updatedAt: Date.now()- 22*60*1000 },
      { id:"7777", name:"Omar", status:"COMPLETED", driver:"998877", price:65000, updatedAt: Date.now()- 3*60*60*1000 },
      { id:"6666", name:"Sara", status:"CANCELED_BY_OFFICE", driver:null, price:70000, updatedAt: Date.now()- 26*60*60*1000 },
    ],
    drivers: [
      { name:"Fadi", chat:"112233", user:"@fadi", approved:true, active:true, archived:false },
      { name:"Hussein", chat:"998877", user:"@hus", approved:true, active:true, archived:false },
      { name:"Ali", chat:"445566", user:"-", approved:false, active:false, archived:false },
      { name:"Old Driver", chat:"101010", user:"-", approved:false, active:false, archived:true },
    ],
    chats: {
      "0412": [
        { dir:"in",  text:"وين صار الطلب؟", ts: Date.now()- 18*60*1000 },
        { dir:"out", text:"بالطريق، بعد 5 دقايق بوصل.", ts: Date.now()- 16*60*1000 },
      ],
      "5180": [
        { dir:"in",  text:"قديش صار السعر؟", ts: Date.now()- 10*60*1000 },
        { dir:"out", text:"صار في تعديل سعر، ناطرين موافقة الإدارة.", ts: Date.now()- 9*60*1000 },
      ],
    }
  };

  function fmt(ts){
    const d = new Date(ts);
    return d.toLocaleString([], { hour:"2-digit", minute:"2-digit" });
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

  // ===== Orders sub-tabs =====
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
            <th>ID</th>
            <th>Status</th>
            <th>Driver</th>
            <th>Price</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows.length ? rows.map(o => `
              <tr data-oid="${o.id}" class="rowClick">
                <td><b>#${o.id}</b><div class="muted small">${o.name || "-"}</div></td>
                <td>${badgeForStatus(o.status)}</td>
                <td>${o.driver ? `<code>${o.driver}</code>` : `<span class="muted">—</span>`}</td>
                <td>${Number(o.pendingPrice || o.price || 0).toLocaleString("en-US")} L.L</td>
                <td>${fmt(o.updatedAt)}</td>
              </tr>
            `).join("") : `<tr><td colspan="5" class="muted">No orders</td></tr>`
          }
        </tbody>
      </table>
    `;

    // click row -> open chat tab
    document.querySelectorAll(".rowClick").forEach((tr) => {
      tr.onclick = () => {
        const id = tr.getAttribute("data-oid");
        openChatForOrder(id);
        // switch tab
        document.querySelectorAll(".tab").forEach(x => x.classList.toggle("active", x.dataset.tab === "chat"));
        sections.forEach((sid) => $(sid).classList.toggle("hidden", sid !== "chat"));
      };
    });

    loadPriceRequests();
  }

  function loadPriceRequests(){
    const rows = S.orders
      .filter(o => o.status === "PRICE_UPDATE_PENDING" && o.pendingPrice)
      .sort((a,b) => b.updatedAt - a.updatedAt);

    $("priceReqList").innerHTML = rows.length ? rows.map(o => `
      <div class="priceReqItem">
        <div class="priceReqTop">
          <div>
            <div class="priceReqTitle">#${o.id} • ${o.name || "Customer"}</div>
            <div class="muted small">Driver: ${o.driver ? o.driver : "—"} • Updated: ${fmt(o.updatedAt)}</div>
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
        </div>

        <div class="muted small" style="margin-top:8px">
          Prototype only: these buttons will call Core endpoints later.
        </div>
      </div>
    `).join("") : `<div class="muted">No pending price updates.</div>`;
  }

  // expose mock actions
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

  // ===== Chat =====
  $("refreshChats").onclick = () => loadChats();
  $("sendBtn").onclick = () => sendChat();
  $("rtlBtn").onclick = () => setDir("rtl");
  $("ltrBtn").onclick = () => setDir("ltr");

  function setDir(dir){
    S.dir = dir;
    document.documentElement.dir = dir;
    document.documentElement.lang = dir === "rtl" ? "ar" : "en";
  }

  function loadChats(){
    const q = String($("chatSearch").value || "").trim().toLowerCase();
    const list = Object.keys(S.chats)
      .map((id) => {
        const o = S.orders.find(x => x.id === id) || { id, name:"Customer", status:"—", updatedAt: Date.now() };
        const msgs = S.chats[id] || [];
        const last = msgs[msgs.length-1]?.text || "";
        const ts = msgs[msgs.length-1]?.ts || o.updatedAt;
        return { id, name:o.name, status:o.status, last, ts };
      })
      .filter(x => !q || x.id.includes(q) || String(x.name||"").toLowerCase().includes(q))
      .sort((a,b)=>b.ts-a.ts);

    $("chatList").innerHTML = list.length ? list.map(x => `
      <div class="chatItem ${S.activeChat===x.id?'active':''}" data-oid="${x.id}">
        <div class="av">${(x.name||"J").trim().slice(0,1).toUpperCase()}</div>
        <div class="meta">
          <div class="t">#${x.id} • ${x.name || "Customer"}</div>
          <div class="s">${x.last || "—"}</div>
        </div>
        <div class="r">${fmt(x.ts)}</div>
      </div>
    `).join("") : `<div class="muted">No chats.</div>`;

    document.querySelectorAll(".chatItem").forEach((el) => {
      el.onclick = () => openChatForOrder(el.getAttribute("data-oid"));
    });

    // live search
    $("chatSearch").oninput = () => loadChats();
  }

  function openChatForOrder(orderId){
    S.activeChat = orderId;
    const o = S.orders.find(x => x.id === orderId);
    $("chatTitle").textContent = o ? `#${o.id} • ${o.name || "Customer"}` : `#${orderId}`;
    $("chatSub").textContent = o ? `Status: ${o.status}` : "—";
    $("chatAvatar").textContent = (o?.name || "J").trim().slice(0,1).toUpperCase();
    renderChat();
    loadChats();
  }

  function renderChat(){
    const msgs = S.chats[S.activeChat] || [];
    if (!S.activeChat){
      $("messages").innerHTML = `<div class="empty muted">Pick an order chat from the left.</div>`;
      return;
    }
    $("messages").innerHTML = msgs.length ? msgs.map(m => `
      <div class="bubbleRow ${m.dir}">
        <div class="bubble ${m.dir==='out'?'out':''}">
          <div>${escapeHtml(m.text)}</div>
          <div class="bmeta">${escapeHtml(fmt(m.ts))}</div>
        </div>
      </div>
    `).join("") : `<div class="empty muted">No messages yet.</div>`;

    // scroll bottom
    const el = $("messages");
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight + 9999; });
  }

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
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
  };

  window.__driverToggle = (chat, enable) => {
    const d = S.drivers.find(x => x.chat === String(chat));
    if (!d) return;
    d.active = !!enable;
    d.archived = false;
    toast(enable ? "Enabled" : "Disabled");
    loadDrivers();
  };
  window.__driverArchive = (chat) => {
    const d = S.drivers.find(x => x.chat === String(chat));
    if (!d) return;
    d.active = false;
    d.approved = false;
    d.archived = true;
    toast("Archived");
    loadDrivers();
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

  // Invites (UI only)
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

  // Quick actions (prototype)
  $("createManualOrderBtn").onclick = () => toast("Manual Order UI (next step)");
  $("openChatFromOrderBtn").onclick = () => toast("Select an order row to open chat");
  $("cancelOrderBtn").onclick = () => toast("Cancel UI (next step)");

  // ===== Init =====
  applyCompact();
  setDir("ltr");

  // initial lock state
  if (isUnlocked()) {
    setAppUnlocked(true);
    markActive();
  } else {
    setAppUnlocked(false);
  }

  // initial load if unlocked
  if (isUnlocked()){
    loadOrders();
    loadDrivers();
    loadChats();
    loadSettingsUI();
  }
})();

