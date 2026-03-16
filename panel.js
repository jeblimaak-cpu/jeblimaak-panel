(() => {
  const CORE_BASE = "";
  const ADMIN_SECRET =
    localStorage.getItem("ADMIN_SECRET") ||
    window.ADMIN_SECRET ||
    "";

  const DEFAULT_ORDER_PRICE = 70000;

  const state = {
    view: "orders",
    orderFilter: "ALL",
    orderSearch: "",
    chatSearch: "",
    driverScope: "all",

    orders: [],
    chats: [],
    drivers: [],
    notifications: [],
    settings: {
      manual_mode: false,
      max_active_orders_per_driver: 3,
      no_reply_min: 3,
      all_refused_min: 5,
      default_order_price_ll: DEFAULT_ORDER_PRICE,
    },

    selectedOrder: null,
    selectedChatPublicId: null,
    selectedPendingPriceOrderId: null,
    setPriceOrderId: null,
  };

  const el = {};

  document.addEventListener("DOMContentLoaded", () => {
    bindElements();
    bindEvents();
    boot();
  });

  function bindElements() {
    el.views = document.querySelectorAll(".view");
    el.navItems = document.querySelectorAll(".nav-item");
    el.bottomNavItems = document.querySelectorAll(".bottom-nav__item");

    el.pageTitle = document.getElementById("pageTitle");
    el.pageSubtitle = document.getElementById("pageSubtitle");

    el.globalSearch = document.getElementById("globalSearch");
    el.orderTabs = document.querySelectorAll(".tab-btn");

    el.ordersTbody = document.getElementById("ordersTbody");
    el.ordersCards = document.getElementById("ordersCards");
    el.ordersEmpty = document.getElementById("ordersEmpty");
    el.refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

    el.allCount = document.getElementById("allCount");
    el.waitingCount = document.getElementById("waitingCount");
    el.activeCount = document.getElementById("activeCount");
    el.pendingPriceCount = document.getElementById("pendingPriceCount");
    el.completedCount = document.getElementById("completedCount");
    el.canceledCount = document.getElementById("canceledCount");

    el.kpiAll = document.getElementById("kpiAll");
    el.kpiWaiting = document.getElementById("kpiWaiting");
    el.kpiActive = document.getElementById("kpiActive");
    el.kpiPending = document.getElementById("kpiPending");

    el.pendingPriceBox = document.getElementById("pendingPriceBox");
    el.pendingPriceOrderId = document.getElementById("pendingPriceOrderId");
    el.pendingCurrentPrice = document.getElementById("pendingCurrentPrice");
    el.pendingRequestedPrice = document.getElementById("pendingRequestedPrice");
    el.pendingDriverName = document.getElementById("pendingDriverName");
    el.pendingViewOrderBtn = document.getElementById("pendingViewOrderBtn");
    el.pendingApproveBtn = document.getElementById("pendingApproveBtn");
    el.pendingSetPriceBtn = document.getElementById("pendingSetPriceBtn");
    el.pendingRejectBtn = document.getElementById("pendingRejectBtn");

    el.chatList = document.getElementById("chatList");
    el.chatSearch = document.getElementById("chatSearch");
    el.refreshChatsBtn = document.getElementById("refreshChatsBtn");
    el.chatMainEmpty = document.getElementById("chatMainEmpty");
    el.chatThread = document.getElementById("chatThread");
    el.chatThreadTitle = document.getElementById("chatThreadTitle");
    el.chatThreadSub = document.getElementById("chatThreadSub");
    el.messagesBox = document.getElementById("messagesBox");
    el.chatComposeForm = document.getElementById("chatComposeForm");
    el.chatMessageInput = document.getElementById("chatMessageInput");

    el.driverScopeButtons = document.querySelectorAll(".filter-chip");
    el.driversList = document.getElementById("driversList");

    el.notificationsList = document.getElementById("notificationsList");

    el.settingsForm = document.getElementById("settingsForm");
    el.manualModeInput = document.getElementById("manualModeInput");
    el.maxOrdersInput = document.getElementById("maxOrdersInput");
    el.noReplyInput = document.getElementById("noReplyInput");
    el.allRefusedInput = document.getElementById("allRefusedInput");
    el.defaultPriceInput = document.getElementById("defaultPriceInput");

    el.orderDrawer = document.getElementById("orderDrawer");
    el.detailOrderTitle = document.getElementById("detailOrderTitle");
    el.detailStatus = document.getElementById("detailStatus");
    el.detailArea = document.getElementById("detailArea");
    el.detailCustomer = document.getElementById("detailCustomer");
    el.detailPhone = document.getElementById("detailPhone");
    el.detailDriver = document.getElementById("detailDriver");
    el.detailPrice = document.getElementById("detailPrice");
    el.detailCreated = document.getElementById("detailCreated");
    el.detailUpdated = document.getElementById("detailUpdated");
    el.detailNotes = document.getElementById("detailNotes");

    el.drawerOpenChatBtn = document.getElementById("drawerOpenChatBtn");
    el.drawerOpenLocationBtn = document.getElementById("drawerOpenLocationBtn");
    el.drawerUpdatePriceBtn = document.getElementById("drawerUpdatePriceBtn");
    el.drawerReassignBtn = document.getElementById("drawerReassignBtn");
    el.drawerCancelOrderBtn = document.getElementById("drawerCancelOrderBtn");
    el.drawerDeliveredBtn = document.getElementById("drawerDeliveredBtn");

    el.openManualOrderBtn = document.getElementById("openManualOrderBtn");
    el.manualOrderModal = document.getElementById("manualOrderModal");
    el.manualOrderForm = document.getElementById("manualOrderForm");
    el.manualBlobText = document.getElementById("manualBlobText");
    el.manualPriceInput = document.getElementById("manualPriceInput");
    el.manualDriverSelect = document.getElementById("manualDriverSelect");

    el.setPriceModal = document.getElementById("setPriceModal");
    el.setPriceForm = document.getElementById("setPriceForm");
    el.setPriceOrderLabel = document.getElementById("setPriceOrderLabel");
    el.setPriceInput = document.getElementById("setPriceInput");
  }

  function bindEvents() {
    el.navItems.forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.dataset.view));
    });

    el.bottomNavItems.forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.dataset.view));
    });

    el.orderTabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        el.orderTabs.forEach((x) => x.classList.remove("active"));
        btn.classList.add("active");
        state.orderFilter = btn.dataset.filter || "ALL";
        renderOrders();
      });
    });

    if (el.globalSearch) {
      el.globalSearch.addEventListener("input", (e) => {
        state.orderSearch = String(e.target.value || "");
        if (state.view === "orders") renderOrders();
      });
    }

    if (el.refreshOrdersBtn) {
      el.refreshOrdersBtn.addEventListener("click", async () => {
        await refreshOrdersOnly();
      });
    }

    if (el.refreshChatsBtn) {
      el.refreshChatsBtn.addEventListener("click", async () => {
        await refreshChatsOnly();
      });
    }

    if (el.chatSearch) {
      el.chatSearch.addEventListener("input", (e) => {
        state.chatSearch = String(e.target.value || "");
        renderChats();
      });
    }

    if (el.chatComposeForm) {
      el.chatComposeForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await sendChatMessage();
      });
    }

    el.driverScopeButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        el.driverScopeButtons.forEach((x) => x.classList.remove("active"));
        btn.classList.add("active");
        state.driverScope = btn.dataset.scope || "all";
        await refreshDriversOnly();
      });
    });

    if (el.settingsForm) {
      el.settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveSettings();
      });
    }

    if (el.openManualOrderBtn) {
      el.openManualOrderBtn.addEventListener("click", () => {
        populateManualDriverOptions();
        el.manualPriceInput.value =
          state.settings.default_order_price_ll || DEFAULT_ORDER_PRICE;
        openModal("manualOrderModal");
      });
    }

    if (el.manualOrderForm) {
      el.manualOrderForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await createManualOrder();
      });
    }

    if (el.setPriceForm) {
      el.setPriceForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await submitSetPrice();
      });
    }

    if (el.pendingViewOrderBtn) {
      el.pendingViewOrderBtn.addEventListener("click", () => {
        const order = getSelectedPendingOrder();
        if (order) openOrderDrawer(order);
      });
    }

    if (el.pendingApproveBtn) {
      el.pendingApproveBtn.addEventListener("click", async () => {
        const order = getSelectedPendingOrder();
        if (!order) return;
        await approvePrice(order.public_id);
      });
    }

    if (el.pendingSetPriceBtn) {
      el.pendingSetPriceBtn.addEventListener("click", () => {
        const order = getSelectedPendingOrder();
        if (!order) return;
        openSetPriceModal(order.public_id);
      });
    }

    if (el.pendingRejectBtn) {
      el.pendingRejectBtn.addEventListener("click", async () => {
        const order = getSelectedPendingOrder();
        if (!order) return;
        await rejectPrice(order.public_id);
      });
    }

    if (el.drawerOpenChatBtn) {
      el.drawerOpenChatBtn.addEventListener("click", async () => {
        if (!state.selectedOrder) return;
        setView("chats");
        closeModal("orderDrawer");
        await openChat(state.selectedOrder.public_id);
      });
    }

    if (el.drawerOpenLocationBtn) {
      el.drawerOpenLocationBtn.addEventListener("click", () => {
        if (!state.selectedOrder) return;
        openLocationForOrder(state.selectedOrder);
      });
    }

    if (el.drawerUpdatePriceBtn) {
      el.drawerUpdatePriceBtn.addEventListener("click", () => {
        if (!state.selectedOrder) return;
        openSetPriceModal(state.selectedOrder.public_id);
      });
    }

    if (el.drawerReassignBtn) {
      el.drawerReassignBtn.addEventListener("click", () => {
        alert("Reassign Driver جاهز UI لكنه يحتاج flow إضافي من الكور.");
      });
    }

    if (el.drawerCancelOrderBtn) {
      el.drawerCancelOrderBtn.addEventListener("click", async () => {
        if (!state.selectedOrder) return;
        await cancelOrder(state.selectedOrder.public_id);
      });
    }

    if (el.drawerDeliveredBtn) {
      el.drawerDeliveredBtn.addEventListener("click", async () => {
        if (!state.selectedOrder) return;
        await completeOrder(state.selectedOrder.public_id);
      });
    }

    document.addEventListener("click", async (e) => {
      const closeTarget = e.target.closest("[data-close]");
      if (closeTarget) {
        closeModal(closeTarget.getAttribute("data-close"));
        return;
      }

      const orderViewBtn = e.target.closest("[data-action='view-order']");
      if (orderViewBtn) {
        const publicId = orderViewBtn.dataset.publicId;
        const order = findOrder(publicId);
        if (order) openOrderDrawer(order);
        return;
      }

      const approveBtn = e.target.closest("[data-action='approve-price']");
      if (approveBtn) {
        await approvePrice(approveBtn.dataset.publicId);
        return;
      }

      const rejectBtn = e.target.closest("[data-action='reject-price']");
      if (rejectBtn) {
        await rejectPrice(rejectBtn.dataset.publicId);
        return;
      }

      const setPriceBtn = e.target.closest("[data-action='set-price']");
      if (setPriceBtn) {
        openSetPriceModal(setPriceBtn.dataset.publicId);
        return;
      }

      const orderRow = e.target.closest("[data-order-row]");
      if (orderRow && !e.target.closest("button")) {
        const order = findOrder(orderRow.dataset.publicId);
        if (order) openOrderDrawer(order);
        return;
      }

      const orderCard = e.target.closest("[data-order-card]");
      if (orderCard && !e.target.closest("button")) {
        const order = findOrder(orderCard.dataset.publicId);
        if (order) openOrderDrawer(order);
        return;
      }

      const chatCard = e.target.closest("[data-chat-card]");
      if (chatCard) {
        await openChat(chatCard.dataset.publicId);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeModal("orderDrawer");
        closeModal("manualOrderModal");
        closeModal("setPriceModal");
      }
    });
  }

  async function boot() {
    try {
      setView("orders");
      await Promise.all([
        fetchOrders(),
        fetchChats(),
        fetchDrivers(),
        fetchSettings(),
      ]);
      buildNotifications();
      renderAll();
      console.log("panel.js loaded");
    } catch (err) {
      console.error(err);
      alert(`Panel load failed: ${err.message}`);
    }
  }

  function renderAll() {
    renderOrders();
    renderPendingPriceBox();
    renderChats();
    renderDrivers();
    renderNotifications();
    fillSettingsForm();
  }

  function apiHeaders() {
    return {
      "Content-Type": "application/json",
      ...(ADMIN_SECRET ? { "X-Admin-Secret": ADMIN_SECRET } : {}),
    };
  }

  async function api(path, options = {}) {
    const res = await fetch(`${CORE_BASE}${path}`, {
      ...options,
      headers: {
        ...apiHeaders(),
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      throw new Error(data?.error || data?.message || `HTTP ${res.status}`);
    }

    return data;
  }

  async function fetchOrders() {
    const tabs = ["ACTIVE", "WAITING", "COMPLETED", "CANCELED"];
    const results = await Promise.all(
      tabs.map((tab) =>
        api(`/admin/orders?tab=${encodeURIComponent(tab)}`)
          .then((r) => r.orders || [])
          .catch(() => [])
      )
    );

    const pending = await api("/admin/orders/price-pending")
      .then((r) => r.orders || [])
      .catch(() => []);

    const map = new Map();

    results.flat().forEach((order) => {
      map.set(order.public_id, { ...order });
    });

    pending.forEach((order) => {
      const prev = map.get(order.public_id) || {};
      map.set(order.public_id, {
        ...prev,
        ...order,
        status: "PRICE_UPDATE_PENDING",
      });
    });

    state.orders = Array.from(map.values()).sort((a, b) => {
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });

    const firstPending = state.orders.find(
      (o) => normalizeStatus(o.status) === "PRICE_UPDATE_PENDING"
    );
    state.selectedPendingPriceOrderId = firstPending ? firstPending.public_id : null;
  }

  async function fetchChats() {
    const data = await api("/admin/chats");
    state.chats = data.chats || [];
  }

  async function fetchDrivers() {
    const scope = state.driverScope || "all";
    const data = await api(`/admin/drivers?scope=${encodeURIComponent(scope)}`);
    state.drivers = data.drivers || [];
  }

  async function fetchSettings() {
    const data = await api("/admin/settings");
    const s = data.settings || {};
    state.settings = {
      manual_mode: Boolean(s.manual_mode),
      max_active_orders_per_driver: Number(s.max_active_orders_per_driver || 3),
      no_reply_min: Number(s.no_reply_min || 3),
      all_refused_min: Number(s.all_refused_min || 5),
      default_order_price_ll: Number(s.default_order_price_ll || DEFAULT_ORDER_PRICE),
    };
  }

  async function refreshOrdersOnly() {
    await fetchOrders();
    buildNotifications();
    renderOrders();
    renderPendingPriceBox();
    renderNotifications();
  }

  async function refreshChatsOnly() {
    await fetchChats();
    renderChats();

    if (state.selectedChatPublicId) {
      await openChat(state.selectedChatPublicId);
    }
  }

  async function refreshDriversOnly() {
    await fetchDrivers();
    renderDrivers();
  }

  function normalizeStatus(status) {
    const s = String(status || "").toUpperCase();
    if (s === "PICKED_UP") return "IN_PROGRESS";
    if (s === "DELIVERED") return "COMPLETED";
    if (s === "CANCELLED") return "CANCELED_BY_OFFICE";
    return s;
  }

  function statusLabel(status) {
    const s = normalizeStatus(status);
    if (s === "WAITING_FOR_DRIVER") return "Waiting";
    if (s === "REASSIGNED") return "Reassigned";
    if (s === "ASSIGNED") return "Assigned";
    if (s === "IN_PROGRESS") return "In Progress";
    if (s === "PRICE_UPDATE_PENDING") return "Pending Price";
    if (s === "COMPLETED") return "Completed";
    if (s === "CANCELED_BY_CUSTOMER") return "Canceled by Customer";
    if (s === "CANCELED_BY_OFFICE") return "Canceled by Office";
    return s || "-";
  }

  function statusClass(status) {
    const s = normalizeStatus(status);
    if (s === "WAITING_FOR_DRIVER" || s === "REASSIGNED") return "status-waiting";
    if (s === "PRICE_UPDATE_PENDING") return "status-pending";
    if (s === "COMPLETED") return "status-completed";
    if (String(s).includes("CANCELED")) return "status-canceled";
    return "status-active";
  }

  function formatPrice(v) {
    return `${Number(v || 0).toLocaleString("en-US")} ل.ل`;
  }

  function formatDate(v) {
    if (!v) return "-";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }

  function relativeTime(v) {
    if (!v) return "-";
    const ts = new Date(v).getTime();
    if (Number.isNaN(ts)) return "-";
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  }

  function setView(view) {
    state.view = view;

    el.views.forEach((node) => {
      node.classList.toggle("active", node.dataset.view === view);
    });

    el.navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    el.bottomNavItems.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });

    if (view === "orders") {
      el.pageTitle.textContent = "Orders";
      el.pageSubtitle.textContent = "إدارة الطلبات والسعر والمحادثات";
    } else if (view === "chats") {
      el.pageTitle.textContent = "Chats";
      el.pageSubtitle.textContent = "محادثات مرتبطة بالطلبات";
    } else if (view === "drivers") {
      el.pageTitle.textContent = "Drivers";
      el.pageSubtitle.textContent = "إدارة السائقين";
    } else if (view === "notifications") {
      el.pageTitle.textContent = "Notifications";
      el.pageSubtitle.textContent = "آخر الأحداث المهمة";
    } else if (view === "settings") {
      el.pageTitle.textContent = "Settings";
      el.pageSubtitle.textContent = "إعدادات النظام";
    }
  }

  function findOrder(publicId) {
    return state.orders.find((o) => String(o.public_id) === String(publicId)) || null;
  }

  function filteredOrders() {
    const q = String(state.orderSearch || "").trim().toLowerCase();

    return state.orders.filter((order) => {
      const st = normalizeStatus(order.status);

      if (state.orderFilter === "WAITING" && !["WAITING_FOR_DRIVER", "REASSIGNED"].includes(st)) return false;
      if (state.orderFilter === "ACTIVE" && !["ASSIGNED", "IN_PROGRESS", "PRICE_UPDATE_PENDING"].includes(st)) return false;
      if (state.orderFilter === "PENDING_PRICE" && st !== "PRICE_UPDATE_PENDING") return false;
      if (state.orderFilter === "COMPLETED" && st !== "COMPLETED") return false;
      if (state.orderFilter === "CANCELED" && !String(st).includes("CANCELED")) return false;

      if (!q) return true;

      const haystack = [
        order.public_id,
        order.customer_name,
        order.customer_phone,
        order.address_text,
        order.request_text,
        order.driver_name,
        order.driver_username,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  function updateOrderCounters() {
    const all = state.orders.length;
    const waiting = state.orders.filter((o) => ["WAITING_FOR_DRIVER", "REASSIGNED"].includes(normalizeStatus(o.status))).length;
    const active = state.orders.filter((o) => ["ASSIGNED", "IN_PROGRESS", "PRICE_UPDATE_PENDING"].includes(normalizeStatus(o.status))).length;
    const pending = state.orders.filter((o) => normalizeStatus(o.status) === "PRICE_UPDATE_PENDING").length;
    const completed = state.orders.filter((o) => normalizeStatus(o.status) === "COMPLETED").length;
    const canceled = state.orders.filter((o) => String(normalizeStatus(o.status)).includes("CANCELED")).length;

    el.allCount.textContent = all;
    el.waitingCount.textContent = waiting;
    el.activeCount.textContent = active;
    el.pendingPriceCount.textContent = pending;
    el.completedCount.textContent = completed;
    el.canceledCount.textContent = canceled;

    el.kpiAll.textContent = all;
    el.kpiWaiting.textContent = waiting;
    el.kpiActive.textContent = active;
    el.kpiPending.textContent = pending;
  }

  function renderOrders() {
    updateOrderCounters();

    const rows = filteredOrders();
    el.ordersEmpty.hidden = rows.length > 0;

    if (el.ordersTbody) {
      el.ordersTbody.innerHTML = rows
        .map((order) => {
          const priceText =
            normalizeStatus(order.status) === "PRICE_UPDATE_PENDING" && order.pending_price_ll
              ? `${formatPrice(order.price_ll)} → ${formatPrice(order.pending_price_ll)}`
              : formatPrice(order.price_ll);

          return `
            <tr data-order-row="1" data-public-id="${escapeHtml(order.public_id)}">
              <td><strong>#${escapeHtml(order.public_id)}</strong></td>
              <td>${escapeHtml(order.customer_name || "-")}</td>
              <td>${escapeHtml(order.address_text || "-")}</td>
              <td>${escapeHtml(order.driver_name || order.driver_username || "—")}</td>
              <td><strong>${escapeHtml(priceText)}</strong></td>
              <td><span class="status-pill ${statusClass(order.status)}">${escapeHtml(statusLabel(order.status))}</span></td>
              <td>${escapeHtml(relativeTime(order.updated_at))}</td>
              <td>
                <div class="row-actions">
                  <button class="row-link" data-action="view-order" data-public-id="${escapeHtml(order.public_id)}">View</button>
                  ${
                    normalizeStatus(order.status) === "PRICE_UPDATE_PENDING"
                      ? `
                        <button class="row-link primary" data-action="approve-price" data-public-id="${escapeHtml(order.public_id)}">Approve</button>
                        <button class="row-link" data-action="set-price" data-public-id="${escapeHtml(order.public_id)}">Set Price</button>
                        <button class="row-link" data-action="reject-price" data-public-id="${escapeHtml(order.public_id)}">Reject</button>
                      `
                      : ""
                  }
                </div>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    if (el.ordersCards) {
      el.ordersCards.innerHTML = rows
        .map((order) => {
          const priceText =
            normalizeStatus(order.status) === "PRICE_UPDATE_PENDING" && order.pending_price_ll
              ? `${formatPrice(order.price_ll)} → ${formatPrice(order.pending_price_ll)}`
              : formatPrice(order.price_ll);

          return `
            <article class="order-mobile-card" data-order-card="1" data-public-id="${escapeHtml(order.public_id)}">
              <div class="order-mobile-card-top">
                <div>
                  <h3>#${escapeHtml(order.public_id)}</h3>
                  <p>${escapeHtml(order.address_text || "-")} · ${escapeHtml(order.customer_name || "-")}</p>
                </div>
                <div style="text-align:left">
                  <div><strong>${escapeHtml(priceText)}</strong></div>
                  <small>${escapeHtml(relativeTime(order.updated_at))}</small>
                </div>
              </div>

              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                <span class="status-pill ${statusClass(order.status)}">${escapeHtml(statusLabel(order.status))}</span>
                <span style="color:#6b7280;font-size:13px;">${escapeHtml(order.driver_name || order.driver_username || "—")}</span>
              </div>

              <div class="order-mobile-actions">
                <button class="soft-btn" data-action="view-order" data-public-id="${escapeHtml(order.public_id)}">View Order</button>
                ${
                  normalizeStatus(order.status) === "PRICE_UPDATE_PENDING"
                    ? `
                      <button class="success-btn" data-action="approve-price" data-public-id="${escapeHtml(order.public_id)}">Approve</button>
                      <button class="soft-btn" data-action="set-price" data-public-id="${escapeHtml(order.public_id)}">Set Price</button>
                      <button class="danger-btn" data-action="reject-price" data-public-id="${escapeHtml(order.public_id)}">Reject</button>
                    `
                    : ""
                }
              </div>
            </article>
          `;
        })
        .join("");
    }
  }

  function getSelectedPendingOrder() {
    if (!state.selectedPendingPriceOrderId) return null;
    return findOrder(state.selectedPendingPriceOrderId);
  }

  function renderPendingPriceBox() {
    const pendingOrder =
      getSelectedPendingOrder() ||
      state.orders.find((o) => normalizeStatus(o.status) === "PRICE_UPDATE_PENDING") ||
      null;

    if (!pendingOrder) {
      el.pendingPriceOrderId.textContent = "No pending requests";
      el.pendingCurrentPrice.textContent = "—";
      el.pendingRequestedPrice.textContent = "—";
      el.pendingDriverName.textContent = "—";
      state.selectedPendingPriceOrderId = null;
      return;
    }

    state.selectedPendingPriceOrderId = pendingOrder.public_id;
    el.pendingPriceOrderId.textContent = `Order #${pendingOrder.public_id}`;
    el.pendingCurrentPrice.textContent = formatPrice(pendingOrder.price_ll);
    el.pendingRequestedPrice.textContent = formatPrice(pendingOrder.pending_price_ll || 0);
    el.pendingDriverName.textContent = pendingOrder.driver_name || pendingOrder.driver_username || "—";
  }

  function renderChats() {
    const q = String(state.chatSearch || "").trim().toLowerCase();
    const rows = state.chats.filter((chat) => {
      if (!q) return true;
      const hay = [
        chat.public_id,
        chat.customer_name,
        chat.last_message_text,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });

    el.chatList.innerHTML = rows
      .map((chat) => {
        const active = String(chat.public_id) === String(state.selectedChatPublicId) ? " active" : "";
        return `
          <article class="chat-item${active}" data-chat-card="1" data-public-id="${escapeHtml(chat.public_id)}">
            <div class="chat-item-top">
              <div>
                <strong>#${escapeHtml(chat.public_id)}</strong>
                <p>${escapeHtml(chat.customer_name || "-")}</p>
              </div>
              <small>${escapeHtml(relativeTime(chat.last_message_at || chat.updated_at))}</small>
            </div>
            <p>${escapeHtml(chat.last_message_text || "No messages yet")}</p>
          </article>
        `;
      })
      .join("");
  }

  async function openChat(publicId) {
    state.selectedChatPublicId = publicId;

    const base = state.chats.find((c) => String(c.public_id) === String(publicId)) || {};
    el.chatMainEmpty.classList.add("hidden");
    el.chatThread.classList.remove("hidden");
    el.chatThreadTitle.textContent = `Order #${publicId}`;
    el.chatThreadSub.textContent = base.customer_name || "-";

    const data = await api(`/admin/orders/${encodeURIComponent(publicId)}/messages`);
    const messages = data.messages || [];

    if (!messages.length) {
      el.messagesBox.innerHTML = `<div class="empty-state"><p>لا يوجد رسائل.</p></div>`;
      renderChats();
      return;
    }

    el.messagesBox.innerHTML = messages
      .map((msg) => {
        const type = String(msg.event_type || "").toUpperCase();
        let who = "office";
        if (type.includes("CUSTOMER")) who = "customer";
        if (type.includes("DRIVER")) who = "driver";
        if (type.includes("OFFICE")) who = "office";

        return `
          <div class="msg ${who}">
            <div>${escapeHtml(msg?.meta?.text || "(no text)")}</div>
            <div class="msg-meta">${escapeHtml(formatDate(msg.created_at))}</div>
          </div>
        `;
      })
      .join("");

    el.messagesBox.scrollTop = el.messagesBox.scrollHeight;
    renderChats();
  }

  async function sendChatMessage() {
    const publicId = state.selectedChatPublicId;
    const text = String(el.chatMessageInput.value || "").trim();

    if (!publicId || !text) return;

    await api(`/admin/orders/${encodeURIComponent(publicId)}/message`, {
      method: "POST",
      body: JSON.stringify({ text }),
    });

    el.chatMessageInput.value = "";
    await fetchChats();
    await openChat(publicId);
  }

  function renderDrivers() {
    el.driversList.innerHTML = state.drivers
      .map((driver) => {
        const isActive = Boolean(driver.is_active);
        const isApproved = Boolean(driver.is_approved);
        const isArchived = Boolean(driver.is_archived);

        return `
          <article class="driver-card">
            <div class="driver-card-top">
              <div>
                <h3>${escapeHtml(driver.name || driver.tg_username || String(driver.tg_chat_id || "-"))}</h3>
                <p>
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin-left:6px;background:${isActive ? "#16a34a" : "#9ca3af"};"></span>
                  ${isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div style="text-align:left;">
                <div><strong>${isApproved ? "Approved" : "Pending"}</strong></div>
                <small>${isArchived ? "Archived" : "Live"}</small>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function buildNotifications() {
    const pendingCount = state.orders.filter((o) => normalizeStatus(o.status) === "PRICE_UPDATE_PENDING").length;
    const waitingCount = state.orders.filter((o) => ["WAITING_FOR_DRIVER", "REASSIGNED"].includes(normalizeStatus(o.status))).length;

    state.notifications = [
      {
        title: "Pending Price Requests",
        body: `${pendingCount} طلبات تحتاج موافقة أو رفض أو تحديد سعر.`,
      },
      {
        title: "Waiting Orders",
        body: `${waitingCount} طلبات بانتظار سائق.`,
      },
      {
        title: "Chats",
        body: `${state.chats.length} محادثات مرتبطة بالطلبات.`,
      },
    ];
  }

  function renderNotifications() {
    el.notificationsList.innerHTML = state.notifications
      .map(
        (n) => `
          <article class="notification-card">
            <div class="notification-card-top">
              <h3>${escapeHtml(n.title)}</h3>
            </div>
            <p>${escapeHtml(n.body)}</p>
          </article>
        `
      )
      .join("");
  }

  function fillSettingsForm() {
    if (!state.settings) return;
    el.manualModeInput.checked = Boolean(state.settings.manual_mode);
    el.maxOrdersInput.value = Number(state.settings.max_active_orders_per_driver || 3);
    el.noReplyInput.value = Number(state.settings.no_reply_min || 3);
    el.allRefusedInput.value = Number(state.settings.all_refused_min || 5);
    el.defaultPriceInput.value = Number(state.settings.default_order_price_ll || DEFAULT_ORDER_PRICE);
  }

  async function saveSettings() {
    const payload = {
      manual_mode: Boolean(el.manualModeInput.checked),
      max_active_orders_per_driver: Number(el.maxOrdersInput.value || 3),
      no_reply_min: Number(el.noReplyInput.value || 3),
      all_refused_min: Number(el.allRefusedInput.value || 5),
      default_order_price_ll: Number(el.defaultPriceInput.value || DEFAULT_ORDER_PRICE),
    };

    await api("/admin/settings", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    state.settings = { ...payload };
    alert("تم حفظ الإعدادات");
  }

  function openOrderDrawer(order) {
    state.selectedOrder = order;

    el.detailOrderTitle.textContent = `Order #${order.public_id}`;
    el.detailStatus.textContent = statusLabel(order.status);
    el.detailArea.textContent = order.address_text || "-";
    el.detailCustomer.textContent = order.customer_name || "-";
    el.detailPhone.textContent = order.customer_phone || "-";
    el.detailDriver.textContent = order.driver_name || order.driver_username || "—";
    el.detailPrice.textContent =
      normalizeStatus(order.status) === "PRICE_UPDATE_PENDING" && order.pending_price_ll
        ? `${formatPrice(order.price_ll)} → ${formatPrice(order.pending_price_ll)}`
        : formatPrice(order.price_ll);
    el.detailCreated.textContent = formatDate(order.created_at);
    el.detailUpdated.textContent = formatDate(order.updated_at);
    el.detailNotes.textContent = order.request_text || "-";

    openModal("orderDrawer");
  }

  function openSetPriceModal(publicId) {
    state.setPriceOrderId = publicId;
    el.setPriceOrderLabel.textContent = `Order #${publicId}`;
    const order = findOrder(publicId);
    el.setPriceInput.value = order?.pending_price_ll || order?.price_ll || "";
    openModal("setPriceModal");
  }

  async function submitSetPrice() {
    if (!state.setPriceOrderId) return;

    const price = Number(el.setPriceInput.value || 0);
    if (!Number.isFinite(price) || price <= 0) {
      alert("سعر غير صالح");
      return;
    }

    await api(`/admin/orders/${encodeURIComponent(state.setPriceOrderId)}/price/set`, {
      method: "POST",
      body: JSON.stringify({ price_ll: price }),
    });

    closeModal("setPriceModal");
    state.setPriceOrderId = null;
    await refreshOrdersOnly();
  }

  async function approvePrice(publicId) {
    await api(`/admin/orders/${encodeURIComponent(publicId)}/price/approve`, {
      method: "POST",
    });
    await refreshOrdersOnly();
  }

  async function rejectPrice(publicId) {
    await api(`/admin/orders/${encodeURIComponent(publicId)}/price/reject`, {
      method: "POST",
    });
    await refreshOrdersOnly();
  }

  async function cancelOrder(publicId) {
    const ok = window.confirm(`إلغاء الطلب #${publicId} ؟`);
    if (!ok) return;

    await api(`/admin/orders/${encodeURIComponent(publicId)}/cancel`, {
      method: "POST",
    });

    closeModal("orderDrawer");
    await refreshOrdersOnly();
    await refreshChatsOnly();
  }

  async function completeOrder(publicId) {
    const ok = window.confirm(`تأكيد تسليم الطلب #${publicId} ؟`);
    if (!ok) return;

    await api(`/admin/orders/${encodeURIComponent(publicId)}/complete`, {
      method: "POST",
    });

    closeModal("orderDrawer");
    await refreshOrdersOnly();
    await refreshChatsOnly();
  }

  function openLocationForOrder(order) {
    const text = String(order.address_text || "").trim();
    if (!text) {
      alert("لا يوجد عنوان");
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  function populateManualDriverOptions() {
    if (!el.manualDriverSelect) return;

    const options = [
      `<option value="">بدون تعيين</option>`,
      ...state.drivers
        .filter((d) => Boolean(d.is_active) && Boolean(d.is_approved) && !Boolean(d.is_archived))
        .map((d) => {
          const label = d.name || d.tg_username || d.tg_chat_id;
          return `<option value="${escapeHtml(String(d.tg_chat_id))}">${escapeHtml(String(label))}</option>`;
        }),
    ];

    el.manualDriverSelect.innerHTML = options.join("");
  }

  async function createManualOrder() {
    const blob_text = String(el.manualBlobText.value || "").trim();
    const price_ll = Number(el.manualPriceInput.value || state.settings.default_order_price_ll || DEFAULT_ORDER_PRICE);
    const driverValue = String(el.manualDriverSelect.value || "").trim();

    if (!blob_text) {
      alert("اكتب Blob Text");
      return;
    }

    const payload = { blob_text, price_ll };

    if (driverValue) {
      payload.driver_tg_chat_id = Number(driverValue);
    }

    await api("/admin/orders/manual", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    el.manualBlobText.value = "";
    el.manualPriceInput.value = state.settings.default_order_price_ll || DEFAULT_ORDER_PRICE;
    el.manualDriverSelect.value = "";

    closeModal("manualOrderModal");
    await refreshOrdersOnly();
  }

  function openModal(id) {
    const node = document.getElementById(id);
    if (node) node.classList.add("active");
  }

  function closeModal(id) {
    const node = document.getElementById(id);
    if (node) node.classList.remove("active");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
})();
