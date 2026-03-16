document.addEventListener("DOMContentLoaded", () => {
  const screens = document.querySelectorAll(".screen");
  const navItems = document.querySelectorAll(".bottom-nav__item");
  const tabs = document.querySelectorAll(".tab-btn");
  const orderCards = document.querySelectorAll(".order-card");
  const closeOrderSheetBtn = document.getElementById("closeOrderSheetBtn");
const orderModal = document.getElementById("orderModal");
const orderModalBackdrop = document.getElementById("orderModalBackdrop");
  const ordersData = {
    "1045": {
      title: "Order #1045",
      area: "Hamra",
      driver: "Ali Hassan",
      price: "$8.00",
      status: "Waiting",
      created: "1:15 PM",
      notes: "Call on arrival"
    },
    "1044": {
      title: "Order #1044",
      area: "Verdun",
      driver: "Hassan Ramadan",
      price: "$10.50",
      status: "Active",
      created: "12:50 PM",
      notes: "Customer waiting outside"
    },
    "1043": {
      title: "Order #1043",
      area: "Ras Beirut",
      driver: "Mohammad Khaled",
      price: "$8.00 → $10.00",
      status: "Pending Price",
      created: "12:30 PM",
      notes: "Driver requested price update"
    },
    "1042": {
      title: "Order #1042",
      area: "Mar Elias",
      driver: "Mohammad Khaled",
      price: "$6.00",
      status: "Completed",
      created: "11:45 AM",
      notes: "Delivered successfully"
    }
  };

  function openScreen(screenName) {
    screens.forEach(screen => {
      screen.classList.remove("active");
      if (screen.dataset.screen === screenName) {
        screen.classList.add("active");
      }
    });

    navItems.forEach(item => {
      item.classList.remove("active");
      if (item.dataset.screen === screenName) {
        item.classList.add("active");
      }
    });
  }

  function setActiveTab(clickedTab) {
    tabs.forEach(tab => tab.classList.remove("active"));
    clickedTab.classList.add("active");
  }

  function setActiveOrderCard(clickedCard) {
    orderCards.forEach(card => card.classList.remove("active"));
    clickedCard.classList.add("active");
  }

  function updateOrderDetails(orderId) {
    const order = ordersData[orderId];
    if (!order) return;

    document.getElementById("detailOrderTitle").textContent = order.title;
    document.getElementById("detailArea").textContent = order.area;
    document.getElementById("detailDriver").textContent = order.driver;
    document.getElementById("detailPrice").textContent = order.price;
    document.getElementById("detailStatus").textContent = order.status;
    document.getElementById("detailCreated").textContent = order.created;
    document.getElementById("detailNotes").textContent = order.notes;

    orderModal.classList.add("active");
  }

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      openScreen(item.dataset.screen);
    });
  });

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      setActiveTab(tab);
    });
  });

  orderCards.forEach(card => {
    card.addEventListener("click", () => {
      const orderId = card.dataset.orderId;
      setActiveOrderCard(card);
      updateOrderDetails(orderId);
    });
  });

  if (closeOrderSheetBtn) {
  closeOrderSheetBtn.addEventListener("click", () => {
    orderModal.classList.remove("active");
    orderCards.forEach(card => card.classList.remove("active"));
  });
}

if (orderModalBackdrop) {
  orderModalBackdrop.addEventListener("click", () => {
    orderModal.classList.remove("active");
    orderCards.forEach(card => card.classList.remove("active"));
  });
}

  openScreen("orders");
  updateOrderDetails("1045");
});
