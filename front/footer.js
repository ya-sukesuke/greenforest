const footer = document.querySelector("footer");

// スマホ判定
const isMobile = window.matchMedia("(hover: none)").matches;

if (isMobile) {
  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    if (window.scrollY < lastScrollY) {
      footer.style.transform = "translateY(0)";
    } else {
      footer.style.transform = "translateY(100%)";
    }
    lastScrollY = window.scrollY;
  });

} else {
  window.addEventListener("mousemove", (e) => {
    const windowHeight = window.innerHeight;

    if (e.clientY > windowHeight - 120) {
      footer.style.transform = "translateY(0)";
    } else {
      footer.style.transform = "translateY(100%)";
    }
  });
}
