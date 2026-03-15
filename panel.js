document.addEventListener("DOMContentLoaded", function () {
  const navItems = document.querySelectorAll(".nav-item");
  const pages = document.querySelectorAll(".page-section");

  if (!navItems.length || !pages.length) return;

  // أول صفحة تكون Orders
  pages.forEach((page, index) => {
    if (index === 0) {
      page.classList.add("active");
    } else {
      page.classList.remove("active");
    }
  });

  navItems.forEach((item, index) => {
    item.addEventListener("click", function (e) {
      e.preventDefault();

      navItems.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");

      pages.forEach((page) => page.classList.remove("active"));

      if (pages[index]) {
        pages[index].classList.add("active");
      }
    });
  });
});
const bottomNavItems = document.querySelectorAll(".bottom-nav__item");

bottomNavItems.forEach(item => {
  item.addEventListener("click", () => {
    bottomNavItems.forEach(btn => btn.classList.remove("active"));
    item.classList.add("active");
  });
});
