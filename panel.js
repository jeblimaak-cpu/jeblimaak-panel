/**
 * panel.js — Jeblimaak Admin Panel
 * Main controller: routing, rendering, events, modals, drawer
 */

'use strict';

/* ─────────────────────────────────────────────────────
   GLOBALS & REFS
   ───────────────────────────────────────────────────── */

const API = window.PanelAPI;

let _currentPage   = 'orders';
let _currentTab    = 'all';
let _allOrders     = [];
let _allDrivers    = [];
let _selectedChat  = null;
let _selectedOrder = null;   // for drawer / set-price context
let _calDate       = new Date();

const $ = id => document.getElementById(id);

/* ─────────────────────────────────────────────────────
   LOCK SCREEN
   ───────────────────────────────────────────────────── */

function initLockScreen() {
  const unlockBtn   = $('lock-unlock-btn');
  const secretInput = $('admin-secret-input');
  const lockError   = $('lock-error');

  function attemptUnlock() {
    const val = secretInput.value.trim();
    if (!val) {
      lockError.classList.remove('hidden');
      secretInput.focus();
      return;
    }
    lockError.classList.add('hidden');
    localStorage.setItem('jeblimaak_admin_secret', val);
    unlockApp();
  }

  secretInput.addEventListener('keydown', e => { if (e.key === 'Enter') attemptUnlock(); });
  unlockBtn.addEventListener('click', attemptUnlock);

  const stored = localStorage.getItem('jeblimaak_admin_secret');
  if (stored) {
    unlockApp();
  }
}

let _appInitialized = false;

function unlockApp() {
  $('lock-screen').classList.add('hidden');
  $('app').classList.remove('hidden');
  if (!_appInitialized) {
    _appInitialized = true;
    initApp();
  }
}

function lockApp() {
  localStorage.removeItem('jeblimaak_admin_secret');
  $('app').classList.add('hidden');
  $('lock-screen').classList.remove('hidden');
  $('admin-secret-input').value = '';
}

/* ─────────────────────────────────────────────────────
   APP INIT
   ───────────────────────────────────────────────────── */

async function initApp() {
  initNav();
  initSidebar();
  initOrdersPage();
  initChatsPage();
  initDriversPage();
  initSettingsPage();
  initOrderDrawer();
  initCreateOrderModal();
  initSetPriceModal();
  initInviteDriverModal();
  await loadOrdersPage();
  await loadDriversPage();
  loadChatsPage();
  loadSettingsPage();
}

/* ─────────────────────────────────────────────────────
   NAVIGATION
   ───────────────────────────────────────────────────── */

function initNav() {
  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  $('sidebar-logout-btn').addEventListener('click', () => {
    if (confirm('Lock the panel?')) lockApp();
  });
}

function navigateTo(page) {
  _currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = $('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
  document.querySelectorAll('.bottom-nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });
}

function initSidebar() {
  const toggleBtn = $('sidebar-toggle');
  const sidebar   = $('sidebar');
  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });
}

/* ─────────────────────────────────────────────────────
   ORDERS PAGE
   ───────────────────────────────────────────────────── */

function initOrdersPage() {
  $('orders-refresh-btn').addEventListener('click', loadOrdersPage);
  $('create-order-btn').addEventListener('click', openCreateOrderModal);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _currentTab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      renderOrderList();
    });
  });

  $('orders-search').addEventListener('input', renderOrderList);
}

async function loadOrdersPage() {
  try {
    _allOrders = await API.apiGetOrders();
    renderOrderTabCounts();
    renderOrderList();
    renderPendingPriceBox();
    updateTopbarPendingDot();
  } catch (err) {
    showToast('Failed to load orders', 'error');
  }
}

function renderOrderTabCounts() {
  const counts = {
    all:      _allOrders.length,
    waiting:  _allOrders.filter(o => isWaiting(o)).length,
    active:   _allOrders.filter(o => isActive(o)).length,
    pending:  _allOrders.filter(o => isPending(o)).length,
    done:     _allOrders.filter(o => isDone(o)).length,
    canceled: _allOrders.filter(o => isCanceled(o)).length,
  };
  Object.entries(counts).forEach(([tab, count]) => {
    const el = $('tab-count-' + tab);
    if (el) el.textContent = count;
  });

  const navBadge = $('nav-badge-orders');
  const pendingCount = counts.pending;
  if (pendingCount > 0) {
    navBadge.textContent = pendingCount;
    navBadge.classList.add('visible');
  } else {
    navBadge.classList.remove('visible');
  }
}

function filterOrdersByTab(orders) {
  switch (_currentTab) {
    case 'waiting':  return orders.filter(isWaiting);
    case 'active':   return orders.filter(isActive);
    case 'pending':  return orders.filter(isPending);
    case 'done':     return orders.filter(isDone);
    case 'canceled': return orders.filter(isCanceled);
    default:         return orders;
  }
}

function renderOrderList() {
  const query    = $('orders-search').value.toLowerCase().trim();
  let filtered   = filterOrdersByTab(_allOrders);

  if (query) {
    filtered = filtered.filter(o =>
      o.publicId.toLowerCase().includes(query) ||
      o.customer.toLowerCase().includes(query) ||
      (o.address || '').toLowerCase().includes(query) ||
      (o.driver || '').toLowerCase().includes(query) ||
      (o.notes || '').toLowerCase().includes(query)
    );
  }

  const list = $('orders-list');
  const tableBody = $('orders-table-body');

  if (filtered.length === 0) {
    list.innerHTML = '<p class="text-muted" style="padding:24px;text-align:center;">No orders found.</p>';
    tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No orders found.</td></tr>';
    return;
  }

  list.innerHTML = filtered.map(order => buildOrderCard(order)).join('');
  tableBody.innerHTML = filtered.map(order => buildOrderTableRow(order)).join('');

  function wireOrderActions(container) {
    container.querySelectorAll('[data-order-id]').forEach(el => {
      const id = el.dataset.orderId;
      const viewBtn = el.querySelector('.btn-view-order');
      if (viewBtn) viewBtn.addEventListener('click', e => { e.stopPropagation(); openOrderDrawer(id); });
      const approveBtn = el.querySelector('.btn-quick-approve');
      if (approveBtn) approveBtn.addEventListener('click', e => { e.stopPropagation(); quickApprove(id); });
      const setPriceBtn = el.querySelector('.btn-quick-set-price');
      if (setPriceBtn) setPriceBtn.addEventListener('click', e => { e.stopPropagation(); openSetPriceModal(id); });
      const rejectBtn = el.querySelector('.btn-quick-reject');
      if (rejectBtn) rejectBtn.addEventListener('click', e => { e.stopPropagation(); quickReject(id); });
    });
  }

  wireOrderActions(list);
  wireOrderActions($('orders-table').querySelector('tbody'));
}

function buildOrderCard(order) {
  const statusClass = resolveStatusClass(order.status);
  const statusLabel = resolveStatusLabel(order.status);

  const isPricePending = order.status === 'PRICE_UPDATE_PENDING';

  const pendingPriceBadge = order.pendingPrice
    ? `<span class="order-card-pending-price">⚠️ ${order.pendingPrice} SAR</span>`
    : '';

  const quickActions = isPricePending
    ? `
      <button class="btn btn-sm btn-ghost btn-view-order">View</button>
      <button class="btn btn-sm btn-success btn-quick-approve">Approve</button>
      <button class="btn btn-sm btn-secondary btn-quick-set-price">Set Price</button>
      <button class="btn btn-sm btn-danger btn-quick-reject">Reject</button>
    `
    : `<button class="btn btn-sm btn-ghost btn-view-order">View Order</button>`;

  return `
    <div class="order-card status-${statusClass}" data-order-id="${order.publicId}" role="listitem">
      <div class="order-card-top">
        <span class="order-card-id">#${order.publicId}</span>
        <span class="order-card-time">${relativeTime(order.updatedAt)}</span>
      </div>
      <div class="order-card-customer">${escHtml(order.customer)}</div>
      ${order.phone ? `<div class="order-card-phone">📞 ${escHtml(order.phone)}</div>` : ''}
      <div class="order-card-address">📍 ${escHtml(order.address || '—')}</div>
      ${order.notes ? `<div class="order-card-notes">${escHtml(order.notes)}</div>` : ''}
      <div class="order-card-meta">
        <span class="badge badge-${statusClass}">${statusLabel}</span>
        ${order.driver ? `<span class="order-card-driver">🛵 ${escHtml(order.driver)}</span>` : ''}
        <div class="order-card-prices">
          <span class="order-card-price">${order.price ? order.price + ' SAR' : '—'}</span>
          ${pendingPriceBadge}
        </div>
      </div>
      <div class="order-card-actions">${quickActions}</div>
    </div>
  `;
}

function buildOrderTableRow(order) {
  const statusClass = resolveStatusClass(order.status);
  const statusLabel = resolveStatusLabel(order.status);
  const isPricePending = order.status === 'PRICE_UPDATE_PENDING';

  const pendingPriceCell = order.pendingPrice
    ? `${order.price || 0} SAR <span class="order-card-pending-price" style="font-size:0.75rem;">⚠️ ${order.pendingPrice}</span>`
    : `${order.price ? order.price + ' SAR' : '—'}`;

  const actions = isPricePending
    ? `
      <button class="btn btn-sm btn-ghost btn-view-order">View</button>
      <button class="btn btn-sm btn-success btn-quick-approve">Approve</button>
      <button class="btn btn-sm btn-secondary btn-quick-set-price">Set Price</button>
      <button class="btn btn-sm btn-danger btn-quick-reject">Reject</button>
    `
    : `<button class="btn btn-sm btn-ghost btn-view-order">View</button>`;

  return `
    <tr data-order-id="${order.publicId}">
      <td class="td-id">#${escHtml(order.publicId)}</td>
      <td class="td-name">${escHtml(order.customer)}</td>
      <td class="td-addr" title="${escHtml(order.address || '')}">${escHtml(order.address || '—')}</td>
      <td>${escHtml(order.driver || '—')}</td>
      <td class="td-price">${pendingPriceCell}</td>
      <td><span class="badge badge-${statusClass}">${statusLabel}</span></td>
      <td class="td-time">${relativeTime(order.updatedAt)}</td>
      <td class="td-actions">${actions}</td>
    </tr>
  `;
}

function renderPendingPriceBox() {
  const pending = _allOrders.filter(o => o.status === 'PRICE_UPDATE_PENDING');
  const box = $('pending-price-box');
  if (pending.length === 0) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  const o = pending[0];
  $('ppb-order-id').textContent     = o.publicId;
  $('ppb-current-price').textContent = o.price ? o.price + ' SAR' : '—';
  $('ppb-requested-price').textContent = o.pendingPrice ? o.pendingPrice + ' SAR' : '—';
  $('ppb-driver').textContent       = o.driver || '—';

  $('ppb-view-btn').onclick    = () => openOrderDrawer(o.publicId);
  $('ppb-approve-btn').onclick = () => quickApprove(o.publicId);
  $('ppb-set-price-btn').onclick = () => openSetPriceModal(o.publicId);
  $('ppb-reject-btn').onclick  = () => quickReject(o.publicId);
}

function updateTopbarPendingDot() {
  const pending = _allOrders.filter(o => o.status === 'PRICE_UPDATE_PENDING');
  $('topbar-pending-dot').classList.toggle('visible', pending.length > 0);
}

async function quickApprove(publicId) {
  try {
    await API.apiApprovePriceRequest(publicId);
    showToast('Price approved ✓', 'success');
    await loadOrdersPage();
  } catch (e) { showToast('Error approving price', 'error'); }
}

async function quickReject(publicId) {
  try {
    await API.apiRejectPriceRequest(publicId);
    showToast('Price request rejected', 'info');
    await loadOrdersPage();
  } catch (e) { showToast('Error rejecting price', 'error'); }
}

/* ─────────────────────────────────────────────────────
   ORDER DRAWER
   ───────────────────────────────────────────────────── */

function initOrderDrawer() {
  $('order-drawer-close').addEventListener('click', closeOrderDrawer);
  $('order-drawer-overlay').addEventListener('click', closeOrderDrawer);

  $('drw-open-chat-btn').addEventListener('click', () => {
    if (_selectedOrder) {
      navigateTo('chats');
      closeOrderDrawer();
      selectChatByOrderId(_selectedOrder.publicId);
    }
  });

  $('drw-open-location-btn').addEventListener('click', () => {
    if (_selectedOrder) {
      const query = encodeURIComponent(_selectedOrder.address || '');
      window.open(`https://maps.google.com/?q=${query}`, '_blank');
    }
  });

  $('drw-set-price-btn').addEventListener('click', () => {
    if (_selectedOrder) {
      closeOrderDrawer();
      openSetPriceModal(_selectedOrder.publicId);
    }
  });

  $('drw-cancel-order-btn').addEventListener('click', async () => {
    if (_selectedOrder && confirm('Cancel this order?')) {
      try {
        await API.apiCancelOrder(_selectedOrder.publicId);
        showToast('Order canceled', 'info');
        closeOrderDrawer();
        loadOrdersPage();
      } catch (e) { showToast('Error canceling order', 'error'); }
    }
  });

  $('drw-mark-delivered-btn').addEventListener('click', async () => {
    if (_selectedOrder) {
      showToast('Marked as delivered (connect backend)', 'info');
    }
  });
}

async function openOrderDrawer(publicId) {
  const order = _allOrders.find(o => o.publicId === publicId) || await API.apiGetOrder(publicId);
  if (!order) { showToast('Order not found', 'error'); return; }
  _selectedOrder = order;

  $('drw-id').textContent       = order.publicId;
  $('drw-status-badge').innerHTML = `<span class="badge badge-${resolveStatusClass(order.status)}">${resolveStatusLabel(order.status)}</span>`;
  $('drw-customer').textContent = order.customer;
  $('drw-phone').textContent    = order.phone || '—';
  $('drw-address').textContent  = order.address || '—';
  $('drw-driver').textContent   = order.driver || 'Unassigned';
  $('drw-price').textContent    = order.price ? order.price + ' SAR' : '—';

  const pendRow = $('drw-pending-price-row');
  if (order.pendingPrice) {
    $('drw-pending-price').textContent = order.pendingPrice + ' SAR';
    pendRow.classList.remove('hidden');
  } else {
    pendRow.classList.add('hidden');
  }

  $('drw-created').textContent = formatDateTime(order.createdAt);
  $('drw-updated').textContent = formatDateTime(order.updatedAt);
  $('drw-notes').textContent   = order.notes || '—';

  $('order-drawer').classList.remove('hidden');
  $('order-drawer-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeOrderDrawer() {
  $('order-drawer').classList.add('hidden');
  $('order-drawer-overlay').classList.add('hidden');
  document.body.style.overflow = '';
  _selectedOrder = null;
}

/* ─────────────────────────────────────────────────────
   CREATE ORDER MODAL
   ───────────────────────────────────────────────────── */

function initCreateOrderModal() {
  $('create-order-modal-close').addEventListener('click', closeCreateOrderModal);
  $('create-order-modal-cancel').addEventListener('click', closeCreateOrderModal);
  $('create-order-modal-overlay').addEventListener('click', closeCreateOrderModal);
  $('create-order-submit-btn').addEventListener('click', submitCreateOrder);
}

function openCreateOrderModal() {
  const driverSelect = $('co-driver');
  driverSelect.innerHTML = '<option value="">— Auto assign —</option>' +
    _allDrivers.filter(d => d.isActive && d.isApproved).map(d =>
      `<option value="${d.tg_chat_id}">${escHtml(d.name)}</option>`
    ).join('');

  $('co-blob-text').value = '';
  $('co-price').value = '';

  $('create-order-modal').classList.remove('hidden');
  $('create-order-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('co-blob-text').focus();
}

function closeCreateOrderModal() {
  $('create-order-modal').classList.add('hidden');
  $('create-order-modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

async function submitCreateOrder() {
  const blob   = $('co-blob-text').value.trim();
  const price  = parseFloat($('co-price').value) || 0;
  const driver = $('co-driver').value;

  if (!blob) {
    $('co-blob-text').focus();
    showToast('Order details are required', 'error');
    return;
  }

  const btn = $('create-order-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Creating...';

  try {
    await API.apiCreateManualOrder(blob, price, driver || null);
    showToast('Order created successfully ✓', 'success');
    closeCreateOrderModal();
    loadOrdersPage();
  } catch (e) {
    showToast('Failed to create order', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Order';
  }
}

/* ─────────────────────────────────────────────────────
   SET PRICE MODAL
   ───────────────────────────────────────────────────── */

function initSetPriceModal() {
  $('set-price-modal-close').addEventListener('click', closeSetPriceModal);
  $('set-price-modal-cancel').addEventListener('click', closeSetPriceModal);
  $('set-price-modal-overlay').addEventListener('click', closeSetPriceModal);
  $('set-price-modal-submit').addEventListener('click', submitSetPrice);
}

function openSetPriceModal(publicId) {
  const order = _allOrders.find(o => o.publicId === publicId);
  $('sp-order-id-display').value = publicId;
  $('sp-price').value = (order && order.pendingPrice) ? order.pendingPrice : (order ? order.price : '');
  $('set-price-modal').classList.remove('hidden');
  $('set-price-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('sp-price').focus();
}

function closeSetPriceModal() {
  $('set-price-modal').classList.add('hidden');
  $('set-price-modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

async function submitSetPrice() {
  const publicId = $('sp-order-id-display').value;
  const price    = parseFloat($('sp-price').value);
  if (!publicId || isNaN(price) || price < 0) {
    showToast('Enter a valid price', 'error');
    return;
  }
  const btn = $('set-price-modal-submit');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    await API.apiSetOrderPrice(publicId, price);
    showToast('Price set ✓', 'success');
    closeSetPriceModal();
    loadOrdersPage();
  } catch (e) {
    showToast('Failed to set price', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Set Price';
  }
}

/* ─────────────────────────────────────────────────────
   CHATS PAGE
   ───────────────────────────────────────────────────── */

function initChatsPage() {
  $('chats-refresh-btn').addEventListener('click', loadChatsPage);
  $('chats-search').addEventListener('input', renderChatList);
  $('chat-send-btn').addEventListener('click', sendChatMessage);
  $('chat-input').addEventListener('keydown', e => { if (e.key === 'Enter') sendChatMessage(); });
}

function loadChatsPage() {
  renderChatList();
}

function renderChatList() {
  const query = $('chats-search').value.toLowerCase().trim();
  let chats = [...API.MOCK_CHATS];
  if (query) {
    chats = chats.filter(c =>
      c.customer.toLowerCase().includes(query) ||
      c.orderId.toLowerCase().includes(query) ||
      c.lastMessage.toLowerCase().includes(query)
    );
  }
  const list = $('chats-list');
  if (chats.length === 0) {
    list.innerHTML = '<p class="text-muted" style="padding:20px;text-align:center;">No chats.</p>';
    return;
  }
  list.innerHTML = chats.map(c => `
    <div class="chat-item${_selectedChat === c.orderId ? ' active' : ''}"
         data-order-id="${c.orderId}" role="listitem">
      <div class="chat-item-top">
        <span class="chat-item-name">${escHtml(c.customer)}</span>
        <span class="chat-item-time">${relativeTime(c.lastTime)}</span>
      </div>
      <div class="chat-item-id">${escHtml(c.orderId)}</div>
      <div class="chat-item-preview">${escHtml(c.lastMessage)}</div>
    </div>
  `).join('');

  list.querySelectorAll('.chat-item').forEach(item => {
    item.addEventListener('click', () => selectChat(item.dataset.orderId));
  });

  if (_selectedChat) {
    selectChat(_selectedChat);
  }

  const navBadge = $('nav-badge-chats');
  navBadge.textContent = chats.length;
  navBadge.classList.toggle('visible', chats.length > 0);
}

function selectChatByOrderId(orderId) {
  const chat = API.MOCK_CHATS.find(c => c.orderId === orderId);
  if (chat) selectChat(orderId);
}

function selectChat(orderId) {
  _selectedChat = orderId;
  const chat = API.MOCK_CHATS.find(c => c.orderId === orderId);
  if (!chat) return;

  document.querySelectorAll('.chat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.orderId === orderId);
  });

  $('chat-thread-empty').style.display = 'none';
  $('chat-thread').style.display = 'flex';

  const order = _allOrders.find(o => o.publicId === orderId);

  $('chat-thread-header').innerHTML = `
    <div>
      <div style="font-weight:600;font-size:0.9rem;">${escHtml(chat.customer)}</div>
      <div style="font-size:0.75rem;color:var(--text-muted);">${escHtml(orderId)} ${order ? '· ' + resolveStatusLabel(order.status) : ''}</div>
    </div>
  `;

  renderMessages(chat.messages);
  $('chat-input').focus();
}

function renderMessages(messages) {
  const container = $('chat-messages');
  container.innerHTML = messages.map(m => {
    const cls = senderClass(m.sender);
    const label = m.sender === 'customer' ? 'Customer' : m.sender === 'driver' ? 'Driver' : 'Office';
    return `
      <div class="msg-bubble from-${m.sender}">
        <div class="msg-sender">${label}</div>
        <div>${escHtml(m.text)}</div>
        <div class="msg-meta">${relativeTime(m.time)}</div>
      </div>
    `;
  }).join('');
  container.scrollTop = container.scrollHeight;
}

function senderClass(sender) {
  if (sender === 'customer') return 'customer';
  if (sender === 'driver')   return 'driver';
  return 'office';
}

async function sendChatMessage() {
  const input = $('chat-input');
  const text = input.value.trim();
  if (!text || !_selectedChat) return;
  input.value = '';
  try {
    await API.apiSendOrderMessage(_selectedChat, text);
    const chat = API.MOCK_CHATS.find(c => c.orderId === _selectedChat);
    if (chat) {
      renderMessages(chat.messages);
      renderChatList();
    }
  } catch (e) { showToast('Failed to send message', 'error'); }
}

/* ─────────────────────────────────────────────────────
   DRIVERS PAGE
   ───────────────────────────────────────────────────── */

function initDriversPage() {
  $('drivers-refresh-btn').addEventListener('click', loadDriversPage);
  $('invite-driver-btn').addEventListener('click', openInviteDriverModal);

  $('driver-filter-chips').addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    document.querySelectorAll('#driver-filter-chips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderDriverGrid(chip.dataset.filter);
  });
}

async function loadDriversPage() {
  try {
    _allDrivers = await API.apiGetDrivers();
    renderDriverGrid('all');
    renderDriverAccountsTable();
  } catch (e) { showToast('Failed to load drivers', 'error'); }
}

function renderDriverGrid(filter) {
  let drivers = _allDrivers;
  if (filter === 'active')   drivers = drivers.filter(d => d.isActive && !d.isArchived);
  if (filter === 'off')      drivers = drivers.filter(d => !d.isActive && !d.isArchived);
  if (filter === 'archived') drivers = drivers.filter(d => d.isArchived);

  const grid = $('drivers-grid');
  if (drivers.length === 0) {
    grid.innerHTML = '<p class="text-muted" style="padding:24px;">No drivers found.</p>';
    return;
  }

  grid.innerHTML = drivers.map(d => buildDriverCard(d)).join('');

  grid.querySelectorAll('.driver-card').forEach(card => {
    const id = card.dataset.driverTg;

    const approveBtn = card.querySelector('.btn-driver-approve');
    if (approveBtn) {
      approveBtn.addEventListener('click', async () => {
        await API.apiApproveDriver(id);
        showToast('Driver approved ✓', 'success');
        await loadDriversPage();
      });
    }

    const toggleBtn = card.querySelector('.btn-driver-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', async () => {
        await API.apiToggleDriverActive(id);
        showToast('Driver status updated', 'info');
        await loadDriversPage();
      });
    }

    const archiveBtn = card.querySelector('.btn-driver-archive');
    if (archiveBtn) {
      archiveBtn.addEventListener('click', async () => {
        if (confirm('Archive this driver?')) {
          await API.apiArchiveDriver(id);
          showToast('Driver archived', 'info');
          await loadDriversPage();
        }
      });
    }
  });
}

function buildDriverCard(d) {
  const initial = d.name.charAt(0).toUpperCase();
  const activeBadge   = d.isActive ? '<span class="badge badge-done">Active</span>' : '<span class="badge badge-canceled">Off</span>';
  const approvedBadge = d.isApproved ? '<span class="badge badge-active">Approved</span>' : '<span class="badge badge-pending">Pending</span>';
  const archivedBadge = d.isArchived ? '<span class="badge badge-canceled">Archived</span>' : '';

  const approveBtn  = !d.isApproved ? `<button class="btn btn-sm btn-success btn-driver-approve">Approve</button>` : '';
  const toggleLabel = d.isActive ? 'Set Off' : 'Set Active';
  const toggleClass = d.isActive ? 'btn-secondary' : 'btn-success';
  const toggleBtn   = !d.isArchived ? `<button class="btn btn-sm ${toggleClass} btn-driver-toggle">${toggleLabel}</button>` : '';
  const archiveBtn  = !d.isArchived ? `<button class="btn btn-sm btn-danger btn-driver-archive">Archive</button>` : '';

  return `
    <div class="driver-card" data-driver-tg="${d.tg_chat_id}">
      <div class="driver-card-top">
        <div class="driver-avatar">${initial}</div>
        <div class="driver-card-info">
          <div class="driver-card-name">${escHtml(d.name)}</div>
          <div class="driver-card-tg">${escHtml(d.telegram_username)}</div>
        </div>
      </div>
      <div class="driver-card-badges">
        ${activeBadge}${approvedBadge}${archivedBadge}
      </div>
      <div class="driver-card-meta">
        <span>TG ID: ${escHtml(d.tg_chat_id)}</span>
        <span>Delivered: ${d.ordersDelivered} orders</span>
      </div>
      <div class="driver-card-actions">
        ${approveBtn}${toggleBtn}${archiveBtn}
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────
   INVITE DRIVER MODAL
   ───────────────────────────────────────────────────── */

function initInviteDriverModal() {
  $('invite-driver-modal-close').addEventListener('click', closeInviteDriverModal);
  $('invite-driver-modal-cancel').addEventListener('click', closeInviteDriverModal);
  $('invite-driver-modal-overlay').addEventListener('click', closeInviteDriverModal);
  $('invite-driver-generate-btn').addEventListener('click', generateDriverInvite);
  $('invite-token-copy-btn').addEventListener('click', copyInviteToken);
}

function openInviteDriverModal() {
  $('invite-expires').value = 24;
  $('invite-token-result').classList.add('hidden');
  $('invite-token-code').textContent = '';
  $('invite-driver-generate-btn').textContent = 'Generate Token';
  $('invite-driver-modal').classList.remove('hidden');
  $('invite-driver-modal-overlay').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeInviteDriverModal() {
  $('invite-driver-modal').classList.add('hidden');
  $('invite-driver-modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

async function generateDriverInvite() {
  const hours = parseInt($('invite-expires').value) || 24;
  const btn = $('invite-driver-generate-btn');
  btn.disabled = true; btn.textContent = 'Generating...';
  try {
    const result = await API.apiCreateDriverInvite(hours);
    $('invite-token-code').textContent = result.token;
    $('invite-token-result').classList.remove('hidden');
    showToast('Invite token generated ✓', 'success');
  } catch (e) {
    showToast('Failed to generate token', 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Regenerate';
  }
}

function copyInviteToken() {
  const token = $('invite-token-code').textContent;
  if (!token) return;
  navigator.clipboard.writeText(token).then(() => {
    showToast('Token copied to clipboard ✓', 'success');
  }).catch(() => {
    showToast('Copy failed — select the token manually', 'error');
  });
}

/* ─────────────────────────────────────────────────────
   SETTINGS PAGE
   ───────────────────────────────────────────────────── */

function initSettingsPage() {
  $('settings-save-btn').addEventListener('click', saveSettings);
  initCalendar();
}

async function loadSettingsPage() {
  try {
    const settings = await API.apiGetSettings();
    $('setting-manual-mode').checked   = settings.manualMode;
    $('setting-max-orders').value      = settings.maxOrdersPerDriver;
    $('setting-no-reply').value        = settings.noReplyMinutes;
    $('setting-all-refused').value     = settings.allRefusedMinutes;
    $('setting-default-price').value   = settings.defaultOrderPrice;
  } catch (e) { showToast('Failed to load settings', 'error'); }

  renderGeneralStats();
  renderDriverAccountsTable();
}

async function saveSettings() {
  const settings = {
    manualMode:          $('setting-manual-mode').checked,
    maxOrdersPerDriver:  parseInt($('setting-max-orders').value) || 5,
    noReplyMinutes:      parseInt($('setting-no-reply').value) || 10,
    allRefusedMinutes:   parseInt($('setting-all-refused').value) || 15,
    defaultOrderPrice:   parseFloat($('setting-default-price').value) || 25,
  };
  const btn = $('settings-save-btn');
  btn.disabled = true; btn.textContent = 'Saving...';
  try {
    await API.apiSaveSettings(settings);
    showToast('Settings saved ✓', 'success');
  } catch (e) { showToast('Failed to save settings', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Save Settings'; }
}

function renderGeneralStats() {
  const total     = _allOrders.length;
  const active    = _allOrders.filter(o => isActive(o)).length;
  const completed = _allOrders.filter(o => isDone(o)).length;
  const pending   = _allOrders.filter(o => isPending(o)).length;
  const revenue   = _allOrders.filter(o => isDone(o)).reduce((s, o) => s + (o.price || 0), 0);

  $('stat-total-orders').textContent    = total;
  $('stat-active-orders').textContent   = active;
  $('stat-completed-orders').textContent = completed;
  $('stat-pending-orders').textContent  = pending;
  $('stat-revenue').textContent         = revenue + ' SAR';
  $('stat-cash').textContent            = Math.round(revenue * 0.7) + ' SAR';
  $('stat-outstanding').textContent     = Math.round(revenue * 0.3) + ' SAR';
}

function renderDriverAccountsTable() {
  const tbody = $('driver-accounts-tbody');
  tbody.innerHTML = _allDrivers.map(d => `
    <tr>
      <td><strong>${escHtml(d.name)}</strong></td>
      <td>${d.ordersDelivered}</td>
      <td>${d.totalEarned} SAR</td>
      <td>${d.outstanding} SAR</td>
      <td>${d.payable} SAR</td>
    </tr>
  `).join('');
}

/* ─────────────────────────────────────────────────────
   CALENDAR
   ───────────────────────────────────────────────────── */

function initCalendar() {
  $('cal-prev-btn').addEventListener('click', () => { _calDate.setMonth(_calDate.getMonth() - 1); renderCalendar(); });
  $('cal-next-btn').addEventListener('click', () => { _calDate.setMonth(_calDate.getMonth() + 1); renderCalendar(); });
  renderCalendar();
}

function renderCalendar() {
  const year  = _calDate.getFullYear();
  const month = _calDate.getMonth();
  const today = new Date();

  $('cal-month-label').textContent = _calDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activityDays = new Set([2, 5, 7, 10, 14, 17, 21, 24, 25, 28]);

  let html = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday   = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const hasDot    = activityDays.has(d);
    const cls       = isToday ? ' today' : '';
    html += `
      <div class="cal-day${cls}" data-day="${d}">
        ${d}
        ${hasDot ? '<span class="cal-dot"></span>' : ''}
      </div>
    `;
  }

  const grid = $('calendar-grid');
  grid.innerHTML = html;

  grid.querySelectorAll('.cal-day:not(.empty)').forEach(el => {
    el.addEventListener('click', () => {
      grid.querySelectorAll('.cal-day').forEach(e => e.classList.remove('selected'));
      el.classList.add('selected');
      const day = parseInt(el.dataset.day);
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const summary = $('calendar-day-summary');
      const ordersOnDay = activityDays.has(day) ? Math.floor(Math.random() * 8) + 1 : 0;
      summary.innerHTML = ordersOnDay
        ? `<div><strong>${dateStr}</strong> — ${ordersOnDay} orders processed</div>`
        : `<div class="calendar-day-summary-text">${dateStr} — No recorded activity</div>`;
    });
  });
}

/* ─────────────────────────────────────────────────────
   STATUS HELPERS
   ───────────────────────────────────────────────────── */

function isWaiting(o)  { return ['WAITING_FOR_DRIVER', 'REASSIGNED'].includes(o.status); }
function isActive(o)   { return ['ASSIGNED', 'IN_PROGRESS'].includes(o.status); }
function isPending(o)  { return o.status === 'PRICE_UPDATE_PENDING'; }
function isDone(o)     { return o.status === 'COMPLETED'; }
function isCanceled(o) { return ['CANCELED_BY_CUSTOMER', 'CANCELED_BY_OFFICE'].includes(o.status); }

function resolveStatusClass(status) {
  if (['WAITING_FOR_DRIVER', 'REASSIGNED'].includes(status)) return 'waiting';
  if (['ASSIGNED', 'IN_PROGRESS'].includes(status))          return 'active';
  if (status === 'PRICE_UPDATE_PENDING')                     return 'pending';
  if (status === 'COMPLETED')                                return 'done';
  if (['CANCELED_BY_CUSTOMER', 'CANCELED_BY_OFFICE'].includes(status)) return 'canceled';
  return 'waiting';
}

function resolveStatusLabel(status) {
  const map = {
    'WAITING_FOR_DRIVER':    'Waiting',
    'REASSIGNED':            'Reassigned',
    'ASSIGNED':              'Assigned',
    'IN_PROGRESS':           'In Progress',
    'PRICE_UPDATE_PENDING':  'Price Pending',
    'COMPLETED':             'Completed',
    'CANCELED_BY_CUSTOMER':  'Canceled (Customer)',
    'CANCELED_BY_OFFICE':    'Canceled (Office)',
  };
  return map[status] || status;
}

/* ─────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
   ───────────────────────────────────────────────────── */

function showToast(message, type = 'info') {
  const container = $('toast-container');
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${escHtml(message)}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ─────────────────────────────────────────────────────
   UTILITY HELPERS
   ───────────────────────────────────────────────────── */

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function relativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 1)  return 'just now';
  if (min < 60) return min + 'm ago';
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

function formatDateTime(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('en', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ─────────────────────────────────────────────────────
   BOOTSTRAP
   ───────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initLockScreen();
});
