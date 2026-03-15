// =====================================
// Jeblimaak Admin Panel
// panel.js
// First starter structure only
// =====================================

// بيانات شكلية مؤقتة
const mockData = {
  orders: [
    {
      id: 1045,
      area: "الحمرا",
      driver: "علي حسن",
      status: "WAITING",
      time: "12:40"
    },
    {
      id: 1044,
      area: "فردان",
      driver: "حسن رمضان",
      status: "ACTIVE",
      time: "12:31"
    }
  ],

  drivers: [
    {
      name: "علي حسن",
      status: "ONLINE",
      activeOrders: 1
    },
    {
      name: "حسن رمضان",
      status: "ONLINE",
      activeOrders: 2
    }
  ],

  notifications: [
    {
      type: "REDISPATCH",
      text: "الطلب #1045 أُعيد توزيعه"
    },
    {
      type: "PRICE_REQUEST",
      text: "طلب تعديل سعر للطلب #1044"
    }
  ],

  settings: {
    language: "ar",
    noAcceptanceRedispatchMinutes: 3,
    allRefusedRedispatchMinutes: 5,
    maxOrdersPerDriver: 3
  }
};

// عناصر عامة
const state = {
  language: "ar"
};

// =====================================
// Initializer
// =====================================
document.addEventListener("DOMContentLoaded", () => {
  initPanel();
});

function initPanel() {
  console.log("Panel initialized");

  bindUI();
  loadInitialPreview();
}

// =====================================
// UI bindings
// =====================================
function bindUI() {
  const navLinks = document.querySelectorAll(".nav-link");
  const tabs = document.querySelectorAll(".tab");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveNav(link);
    });
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setActiveTab(tab);
    });
  });
}

function setActiveNav(clickedLink) {
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.classList.remove("active");
  });

  clickedLink.classList.add("active");
}

function setActiveTab(clickedTab) {
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach((tab) => {
    tab.classList.remove("active");
  });

  clickedTab.classList.add("active");
}

// =====================================
// Preview loaders
// =====================================
function loadInitialPreview() {
  console.log("Loading preview data...");
  console.log(mockData);
}

// =====================================
// Orders
// =====================================
function renderOrders(orders) {
  console.log("Render orders", orders);
}

function fetchOrdersFromCore() {
  console.log("Later: fetch /orders from core");
}

// =====================================
// Drivers
// =====================================
function renderDrivers(drivers) {
  console.log("Render drivers", drivers);
}

function fetchDriversFromCore() {
  console.log("Later: fetch /drivers from core");
}

// =====================================
// Notifications
// =====================================
function renderNotifications(notifications) {
  console.log("Render notifications", notifications);
}

function fetchNotificationsFromCore() {
  console.log("Later: fetch /notifications from core");
}

// =====================================
// Settings
// =====================================
function loadSettings(settings) {
  console.log("Load settings", settings);
}

function saveSettingsToCore(settings) {
  console.log("Later: save settings to core", settings);
}

// =====================================
// Language
// =====================================
function setLanguage(lang) {
  state.language = lang;

  if (lang === "ar") {
    document.documentElement.lang = "ar";
    document.documentElement.dir = "rtl";
  } else {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }

  console.log("Language changed to:", lang);
}

// =====================================
// Order actions
// =====================================
function openOrderDetails(orderId) {
  console.log("Open order details:", orderId);
}

function reassignOrder(orderId) {
  console.log("Reassign order:", orderId);
}

function completeOrder(orderId) {
  console.log("Complete order:", orderId);
}

function cancelOrder(orderId) {
  console.log("Cancel order:", orderId);
}

function openOrderLocation(lat, lng) {
  const url = `https://maps.google.com/?q=${lat},${lng}`;
  window.open(url, "_blank");
}
