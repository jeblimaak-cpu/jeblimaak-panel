const CORE_BASE = ""; // مثال: "" إذا نفس الدومين، أو "https://your-core-domain.com"
const ADMIN_SECRET = localStorage.getItem("ADMIN_SECRET") || "";

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
  settings: null,
  selectedOrder: null,
  selectedChatOrderId: null,
  selectedPendingPriceOrderId: null,
  setPriceOrderId: null,
  defaultOrderPrice: 70000,
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

  el.allCount = document.getElementById("allCount");
  el.waitingCount = document.getElementById("waitingCount");
  el.activeCount = document.getElementBy
