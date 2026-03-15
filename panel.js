document.addEventListener("DOMContentLoaded", () => {

  /* -------- PAGE NAVIGATION -------- */

  const navItems = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page");

  navItems.forEach(btn => {
    btn.addEventListener("click", () => {

      const page = btn.dataset.page;

      navItems.forEach(n => n.classList.remove("active"));
      btn.classList.add("active");

      pages.forEach(p => p.classList.remove("active"));
      document.querySelector(`.page[data-page="${page}"]`).classList.add("active");

    });
  });

  /* -------- DEMO DATA -------- */

  const orders = [
    {
      id:"#1045",
      area:"Hamra",
      driver:"Ali Hassan",
      price:8,
      status:"WAITING",
      time:"13:15",
      note:"Call before arrival"
    },
    {
      id:"#1044",
      area:"Verdun",
      driver:"Hassan Ramadan",
      price:10,
      status:"ACTIVE",
      time:"12:40",
      note:"Customer waiting outside"
    },
    {
      id:"#1043",
      area:"Ras Beirut",
      driver:"Mohammad Khaled",
      price:8,
      requestedPrice:10,
      status:"PENDING_PRICE",
      time:"12:10",
      note:"Driver requested price change"
    },
    {
      id:"#1042",
      area:"Mar Elias",
      driver:"Karim Chahade",
      price:6,
      status:"COMPLETED",
      time:"11:30",
      note:"Delivered"
    }
  ];

  const drivers = [
    {
      name:"Ali Hassan",
      tg:"728373",
      status:"ONLINE",
      active:1,
      delivered:10,
      value:82
    },
    {
      name:"Hassan Ramadan",
      tg:"283732",
      status:"BUSY",
      active:2,
      delivered:7,
      value:54
    },
    {
      name:"Karim Chahade",
      tg:"283111",
      status:"OFFLINE",
      active:0,
      delivered:4,
      value:30
    }
  ];

  /* -------- RENDER ORDERS -------- */

  const orderList = document.getElementById("orderList");

  function renderOrders(){

    orderList.innerHTML = "";

    orders.forEach((o,i)=>{

      const el = document.createElement("div");
      el.className = "order-item";

      el.innerHTML = `
        <strong>${o.id}</strong>
        <div>${o.area} · ${o.driver}</div>
        <small>$${o.price}</small>
      `;

      el.addEventListener("click",()=>selectOrder(i));

      orderList.appendChild(el);

    });

    updateStats();
  }

  /* -------- SELECT ORDER -------- */

  function selectOrder(i){

    const o = orders[i];

    document.getElementById("detailOrderId").textContent = o.id;
    document.getElementById("detailArea").textContent = o.area;
    document.getElementById("detailDriver").textContent = o.driver;
    document.getElementById("detailPrice").textContent = "$"+o.price;
    document.getElementById("detailStatus").textContent = o.status;
    document.getElementById("detailTime").textContent = o.time;
    document.getElementById("detailNotes").textContent = o.note;

    if(o.status==="PENDING_PRICE"){

      document.getElementById("pr-order").textContent = o.id;
      document.getElementById("pr-current").textContent = "$"+o.price;
      document.getElementById("pr-requested").textContent = "$"+o.requestedPrice;
      document.getElementById("pr-driver").textContent = o.driver;

      document.getElementById("pendingPricePanel").style.display="block";

    }else{

      document.getElementById("pendingPricePanel").style.display="none";

    }

  }

  /* -------- STATS -------- */

  function updateStats(){

    let waiting=0;
    let active=0;
    let pending=0;

    orders.forEach(o=>{
      if(o.status==="WAITING") waiting++;
      if(o.status==="ACTIVE") active++;
      if(o.status==="PENDING_PRICE") pending++;
    });

    document.getElementById("waitingCount").textContent = waiting;
    document.getElementById("activeCount").textContent = active;
    document.getElementById("pendingPriceCount").textContent = pending;
    document.getElementById("availableDriversCount").textContent =
      drivers.filter(d=>d.status==="ONLINE").length;

  }

  /* -------- DRIVERS -------- */

  const driverList = document.getElementById("driverList");

  function renderDrivers(){

    if(!driverList) return;

    driverList.innerHTML="";

    drivers.forEach((d,i)=>{

      const el=document.createElement("div");
      el.className="order-item";

      el.innerHTML=`
        <strong>${d.name}</strong>
        <div>${d.status}</div>
      `;

      el.addEventListener("click",()=>selectDriver(i));

      driverList.appendChild(el);

    });

  }

  function selectDriver(i){

    const d = drivers[i];

    document.getElementById("driverName").textContent=d.name;
    document.getElementById("driverTelegramId").textContent=d.tg;
    document.getElementById("driverStatus").textContent=d.status;
    document.getElementById("driverCurrentOrders").textContent=d.active;
    document.getElementById("driverDeliveredToday").textContent=d.delivered;
    document.getElementById("driverTotalValue").textContent="$"+d.value;

  }

  /* -------- CHATS DEMO -------- */

  const chatList = document.getElementById("chatList");

  if(chatList){

    orders.forEach(o=>{

      const el=document.createElement("div");
      el.className="order-item";

      el.innerHTML=`
        <strong>${o.id}</strong>
        <div>Customer question</div>
      `;

      el.onclick=()=>{
        document.getElementById("chatOrder").textContent=o.id;
        document.getElementById("chatCustomer").textContent="WhatsApp";
        document.getElementById("chatDriver").textContent=o.driver;

        document.getElementById("messagesBox").innerHTML=`
          <div>Customer: hello</div>
          <div>Driver: on my way</div>
        `;
      };

      chatList.appendChild(el);

    });

  }

  /* -------- MANUAL ORDER MODAL -------- */

  const modal = document.getElementById("manualOrderModal");

  document.getElementById("manualOrderBtn")?.addEventListener("click",()=>{
    modal.classList.add("active");
  });

  document.getElementById("closeManualOrderModal")?.addEventListener("click",()=>{
    modal.classList.remove("active");
  });

  document.getElementById("createManualOrderBtn")?.addEventListener("click",()=>{

    const area=document.getElementById("manualArea").value;
    const price=document.getElementById("manualPrice").value || 8;

    orders.unshift({
      id:"#"+Math.floor(Math.random()*9000+1000),
      area:area,
      driver:"—",
      price:price,
      status:"WAITING",
      time:new Date().toLocaleTimeString(),
      note:"Manual order"
    });

    modal.classList.remove("active");

    renderOrders();

  });

  /* -------- INIT -------- */

  renderOrders();
  renderDrivers();

});
