document.addEventListener("DOMContentLoaded", () => {

  /* -------- sidebar navigation -------- */

  const navItems = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page");

  navItems.forEach(btn => {
    btn.addEventListener("click", () => {

      const page = btn.dataset.page;

      navItems.forEach(n => n.classList.remove("active"));
      btn.classList.add("active");

      pages.forEach(p => p.classList.remove("active"));

      const target = document.querySelector(`.page[data-page="${page}"]`);
      if(target) target.classList.add("active");

    });
  });


  /* -------- order selection -------- */

  const orders = document.querySelectorAll(".order-card");

  orders.forEach(card => {

    card.addEventListener("click", () => {

      orders.forEach(o => o.classList.remove("active"));
      card.classList.add("active");

      const id = card.dataset.order;

      /* demo data */

      if(id === "1045"){
        updateDetails("#1045","الحمرا","علي حسن","$8.00","Waiting","1:15 PM","اتصال قبل الوصول");
      }

      if(id === "1044"){
        updateDetails("#1044","فردان","حسن رمضان","$10.50","Active","12:50 PM","بانتظار الزبون");
      }

      if(id === "1043"){
        updateDetails("#1043","رأس بيروت","محمد خالد","$8.00","Pending Price","12:30 PM","طلب تعديل السعر");
      }

      if(id === "1042"){
        updateDetails("#1042","مار الياس","كريم شحادة","$6.00","Completed","11:45 AM","تم التسليم");
      }

    });

  });


  /* -------- update order details -------- */

  function updateDetails(id,area,driver,price,status,time,notes){

    document.getElementById("detailOrderId").textContent = id;
    document.getElementById("detailArea").textContent = area;
    document.getElementById("detailDriver").textContent = driver;
    document.getElementById("detailPrice").textContent = price;
    document.getElementById("detailStatus").textContent = status;
    document.getElementById("detailTime").textContent = time;
    document.getElementById("detailNotes").textContent = notes;

  }


  /* -------- order tabs (UI only) -------- */

  const tabs = document.querySelectorAll("#orderTabs .nav-link");

  tabs.forEach(tab => {
    tab.addEventListener("click", e => {

      e.preventDefault();

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

    });
  });

});
