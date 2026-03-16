document.addEventListener("DOMContentLoaded", () => {
  // Views (desktop sidebar + mobile bottom nav)
  const views = document.querySelectorAll(".view");
  const sideItems = document.querySelectorAll(".side-item");
  const bottomItems = document.querySelectorAll(".bottom-item");

  const pageTitle = document.getElementById("pageTitle");
  const pageSubtitle = document.getElementById("pageSubtitle");

  // Orders UI
  const tabs = document.querySelectorAll(".tab");
  const globalSearch = document.getElementById("globalSearch");
  const refreshBtn = document.getElementById("refreshBtn");

  const ordersTbody = document.getElementById("ordersTbody");
  const ordersCards = document.getElementById("ordersCards");
  const ordersEmpty = document.getElementById("ordersEmpty");

  // Badges
  const allCount = document.getElementById("allCount");
  const waitingCount = document.getElementById("waitingCount");
  const activeCount = document.getElementById("activeCount");
  const pendingPriceCount = document.getElementById("pendingPriceCount");
  const completedCount = document.getElementById("completedCount");
  const canceledCount = document.getElementById("canceledCount");

  // KPIs
  const kpiAll = document.getElementById("kpiAll");
  const kpiWaiting = document.getElementById("kpiWaiting");
  const kpiActive = document.getElementById("kpiActive");
  const kpiPending = document.getElementById("kpiPending");

  // Drawer
  const orderDrawer = document.getElementById("orderDrawer");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const closeDrawerBtn = document.getElementById("closeDrawerBtn");

  const detailOrderTitle = document.getElementById("detailOrderTitle");
  const detailStatusLine = document.getElementById("detailStatusLine");
  const detailArea = document.getElementById("detailArea");
  const detailCustomer = document.getElementById("detailCustomer");
  const detailDriver = document.getElementById("detailDriver");
  const detailPhone = document.getElementById("detailPhone");
  const detailPrice = document.getElementById("detailPrice");
  const detailCreated = document.getElementById("detailCreated");
  const detailNotes = document.getElementById("detailNotes");

  // ===== Mock data (رح نستبدله بـ API لاحقاً)
  const STATUS = {
    WAITING_FOR_DRIVER: "WAITING_FOR_DRIVER",
    ASSIGNED: "ASSIGNED",
    PRICE_UPDATE_PENDING: "PRICE_UPDATE_PENDING",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELED_BY_OFFICE: "CANCELED_BY_OFFICE",
  };

  let orders = [
    {
      public_id: "1045",
      customer_name: "Ali Hassan",
      customer_phone: "+96170111222",
      area: "Hamra",
      address_text: "Hamra street",
      driver_name: null,
      price_ll: 70000,
      pending_price_ll: null,
      status: STATUS.WAITING_FOR_DRIVER,
      updated_at: Date.now() - 2 * 60 * 1000,
      created_at: Date.now() - 24 * 60 * 1000,
      request_text: "Call on arrival"
    },
    {
      public_id: "1044",
      customer_name: "Hassan Ramadan",
      customer_phone: "+96170333444",
      area: "Verdun",
      address_text: "Verdun main road",
      driver_name: "Ali Hassan",
      price_ll: 90000,
      pending_price_ll: null,
      status: STATUS.IN_PROGRESS,
      updated_at: Date.now() - 9 * 60 * 1000,
      created_at: Date.now() - 40 * 60 * 1000,
      request_text: "Customer waiting outside"
    },
    {
      public_id: "1043",
      customer_name: "Mohammad Khaled",
      customer_phone: "+96170666777",
      area: "Ras Beirut",
      address_text: "Ras Beirut",
      driver_name: "Mohammad Khaled",
      price_ll: 70000,
      pending_price_ll: 90000,
      status: STATUS.PRICE_UPDATE_PENDING,
      updated_at: Date.now() - 20 * 60 * 1000,
      created_at: Date.now() - 70 * 60 * 1000,
      request_text: "Driver requested price update"
    },
    {
      public_id: "1042",
      customer_name: "Karim Chahade",
      customer_phone: "+96170999999",
      area: "Mar Elias",
      address_text: "Mar Elias",
      driver_name: "Mohammad Khaled",
      price_ll: 60000,
      pending_price_ll: null,
      status: STATUS.COMPLETED,
      updated_at: Date.now() - 90 * 60 * 1000,
      created_at: Date.now() - 3 * 60 * 60 * 1000,
      request_text: "Delivered successfully"
    },
  ];

  // ===== State
  let activeView = "orders";
  let activeFilter = "ALL";
  let query = "";

  // ===== Helpers
  function fmtLL(n){
    const x = Number(n || 0);
    return `${x.toLocaleString("en-US")} ل.ل`;
  }

  function relativeTime(ts){
    const ms = Math.max(0, Date.now() - Number(ts || Date.now()));
    const m = Math.floor(ms / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }

  function statusLabel(st){
    const s = String(st || "").toUpperCase();
    if (s === STATUS.WAITING_FOR_DRIVER) return { text: "Waiting", cls: "pill--waiting" };
    if (s === STATUS.PRICE_UPDATE_PENDING) return { text: "Pending Price", cls: "pill--pending" };
    if (s === STATUS.COMPLETED) return { text: "Completed", cls: "pill--done" };
    if (s.includes("CANCELED")) return { text: "Canceled", cls: "pill--canceled" };
    // Active group
    return { text: "Active", cls: "pill--active" };
  }

  function matchesFilter(o){
    const st = String(o.status || "").toUpperCase();
    if (activeFilter === "ALL") return true;
    if (activeFilter === "WAITING") return st === STATUS.WAITING_FOR_DRIVER;
    if (activeFilter === "ACTIVE") return [STATUS.ASSIGNED, STATUS.IN_PROGRESS, STATUS.PRICE_UPDATE_PENDING].includes(st);
    if (activeFilter === "PENDING_PRICE") return st === STATUS.PRICE_UPDATE_PENDING;
    if (activeFilter === "COMPLETED") return st === STATUS.COMPLETED;
    if (activeFilter === "CANCELED") return st.includes("CANCELED");
    return true;
  }

  function matchesQuery(o){
    const q = String(query || "").trim().toLowerCase();
    if (!q) return true;
    const hay = [
      o.public_id,
      o.customer_name,
      o.area,
      o.driver_name,
      o.address_text,
      o.request_text,
      o.customer_phone,
    ].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  }

  function computeCounts(){
    const all = orders.length;
    const waiting = orders.filter(o => String(o.status).toUpperCase() === STATUS.WAITING_FOR_DRIVER).length;
    const active = orders.filter(o => [STATUS.ASSIGNED, STATUS.IN_PROGRESS, STATUS.PRICE_UPDATE_PENDING].includes(String(o.status).toUpperCase())).length;
    const pending = orders.filter(o => String(o.status).toUpperCase() === STATUS.PRICE_UPDATE_PENDING).length;
    const completed = orders.filter(o => String(o.status).toUpperCase() === STATUS.COMPLETED).length;
    const canceled = orders.filter(o => String(o.status).toUpperCase().includes("CANCELED")).length;

    allCount.textContent = all;
    waitingCount.textContent = waiting;
    activeCount.textContent = active;
    pendingPriceCount.textContent = pending;
    completedCount.textContent = completed;
    canceledCount.textContent = canceled;

    kpiAll.textContent = all;
    kpiWaiting.textContent = waiting;
    kpiActive.textContent = active;
    kpiPending.textContent = pending;
  }

  function filteredOrders(){
    return orders
      .filter(matchesFilter)
      .filter(matchesQuery)
      .sort((a,b) => Number(b.updated_at||0) - Number(a.updated_at||0));
  }

  function render(){
    computeCounts();
    const rows = filteredOrders();

    // Empty
    ordersEmpty.hidden = rows.length > 0;

    // Table
    ordersTbody.innerHTML = rows.map(o => {
      const st = statusLabel(o.status);
      const priceText = (String(o.status).toUpperCase() === STATUS.PRICE_UPDATE_PENDING && o.pending_price_ll)
        ? `${fmtLL(o.price_ll)} → ${fmtLL(o.pending_price_ll)}`
        : fmtLL(o.price_ll);

      return `
        <tr data-id="${o.public_id}">
          <td><strong>#${o.public_id}</strong></td>
          <td>${o.customer_name || "-"}</td>
          <td>${o.area || "-"}</td>
          <td>${o.driver_name || "—"}</td>
          <td><strong>${priceText}</strong></td>
          <td><span class="pill ${st.cls}">${st.text}</span></td>
          <td>${relativeTime(o.updated_at)}</td>
          <td>
            <div class="row-actions">
              <button class="link-btn" data-act="view" data-id="${o.public_id}">View</button>
              ${String(o.status).toUpperCase() === STATUS.PRICE_UPDATE_PENDING ? `
                <button class="link-btn" data-act="approve" data-id="${o.public_id}">Approve</button>
                <button class="link-btn" data-act="reject" data-id="${o.public_id}">Reject</button>
              ` : ``}
            </div>
          </td>
        </tr>
      `;
    }).join("");

    // Cards (mobile)
    ordersCards.innerHTML = rows.map(o => {
      const st = statusLabel(o.status);
      const priceText = (String(o.status).toUpperCase() === STATUS.PRICE_UPDATE_PENDING && o.pending_price_ll)
        ? `${fmtLL(o.price_ll)} → ${fmtLL(o.pending_price_ll)}`
        : fmtLL(o.price_ll);

      return `
        <div class="card" data-id="${o.public_id}">
          <div class="card__top">
            <div>
              <div class="card__id">#${o.public_id}</div>
              <div class="card__sub">${o.area || "-"} · ${o.customer_name || "-"}</div>
            </div>
            <div style="text-align:left">
              <div class="card__price">${priceText}</div>
              <div class="card__sub">${relativeTime(o.updated_at)}</div>
            </div>
          </div>

          <div class="card__bottom">
            <span class="pill ${st.cls}">${st.text}</span>
            <button class="btn btn--soft" data-act="view" data-id="${o.public_id}">View</button>
          </div>
        </div>
      `;
    }).join("");
  }

  function setView(name){
    activeView = name;

    views.forEach(v => v.classList.toggle("active", v.dataset.view === name));
    sideItems.forEach(b => b.classList.toggle("active", b.dataset.view === name));
    bottomItems.forEach(b => b.classList.toggle("active", b.dataset.view === name));

    // Title/subtitle
    if (name === "orders") { pageTitle.textContent="Orders"; pageSubtitle.textContent="إدارة الطلبات والسعر والمحادثات"; }
    if (name === "chats") { pageTitle.textContent="Chats"; pageSubtitle.textContent="محادثات مرتبطة بالطلبات"; }
    if (name === "drivers") { pageTitle.textContent="Drivers"; pageSubtitle.textContent="إدارة السائقين وحالتهم"; }
    if (name === "notifications") { pageTitle.textContent="Notifications"; pageSubtitle.textContent="آخر الأحداث المهمة"; }
    if (name === "settings") { pageTitle.textContent="Settings"; pageSubtitle.textContent="إعدادات النظام"; }
  }

  function openDrawer(orderId){
    const o = orders.find(x => String(x.public_id) === String(orderId));
    if (!o) return;

    const st = statusLabel(o.status);
    detailOrderTitle.textContent = `Order #${o.public_id}`;
    detailStatusLine.innerHTML = `<span class="pill ${st.cls}">${st.text}</span> <span style="margin-inline-start:8px;color:#64748b">updated ${relativeTime(o.updated_at)} ago</span>`;
    detailArea.textContent = o.area || "—";
    detailCustomer.textContent = o.customer_name || "—";
    detailDriver.textContent = o.driver_name || "—";
    detailPhone.textContent = o.customer_phone || "—";
    detailPrice.textContent = fmtLL(o.price_ll) + (o.pending_price_ll ? ` (pending: ${fmtLL(o.pending_price_ll)})` : "");
    detailCreated.textContent = relativeTime(o.created_at) + " ago";
    detailNotes.textContent = o.request_text || "—";

    orderDrawer.classList.add("active");
    orderDrawer.setAttribute("aria-hidden", "false");
  }

  function closeDrawer(){
    orderDrawer.classList.remove("active");
    orderDrawer.setAttribute("aria-hidden", "true");
  }

  // ===== Events
  sideItems.forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));
  bottomItems.forEach(b => b.addEventListener("click", () => setView(b.dataset.view)));

  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    activeFilter = t.dataset.filter || "ALL";
    render();
  }));

  globalSearch.addEventListener("input", (e) => {
    query = e.target.value || "";
    render();
  });

  refreshBtn.addEventListener("click", () => {
    // placeholder (later: fetch from API)
    render();
  });

  // click handlers for table/cards (event delegation)
  document.addEventListener("click", (e) => {
    const row = e.target.closest("tr[data-id]");
    const card = e.target.closest(".card[data-id]");
    const actionBtn = e.target.closest("[data-act][data-id]");

    if (actionBtn){
      const act = actionBtn.dataset.act;
      const id = actionBtn.dataset.id;

      if (act === "view") openDrawer(id);

      // placeholders now
      if (act === "approve") alert(`Approve price for #${id} (later API)`);
      if (act === "reject") alert(`Reject price for #${id} (later API)`);
      return;
    }

    if (row) openDrawer(row.dataset.id);
    if (card) openDrawer(card.dataset.id);
  });

  drawerBackdrop.addEventListener("click", closeDrawer);
  closeDrawerBtn.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  // ===== Boot
  setView("orders");
  render();
});
