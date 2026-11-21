export function connectHomeNavTheme() {
  const nav = document.querySelector("[data-home-header] nav");
  const header = nav?.parentElement;
  const hero = document.querySelector("[data-home-hero]");
  if (!nav || !header || !hero) return;

  let frame: number | undefined;

  const update = () => {
    frame = undefined;
    const bar = nav.getBoundingClientRect();
    const theme = hero.getBoundingClientRect().bottom <= bar.top + bar.height / 2 ? "light" : "dark";
    if (header.dataset.theme !== theme) header.dataset.theme = theme;
  };

  function schedule() {
    frame ??= requestAnimationFrame(update);
  }

  update();
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("pageshow", schedule);
  return () => {
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    window.removeEventListener("pageshow", schedule);
    if (frame !== undefined) cancelAnimationFrame(frame);
  };
}
