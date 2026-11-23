export function connectHomeNavTheme() {
  const nav = document.querySelector("[data-home-header] nav");
  const header = nav?.parentElement;
  const darkSections = Array.from(document.querySelectorAll("[data-home-hero], [data-home-dark]"));
  if (!nav || !header) return;

  let frame: number | undefined;

  const update = () => {
    frame = undefined;
    const bar = nav.getBoundingClientRect();
    const midpoint = bar.top + bar.height / 2;
    const overDarkSection = darkSections.some((section) => {
      const { top, bottom } = section.getBoundingClientRect();
      return top <= midpoint && midpoint < bottom;
    });
    const theme = overDarkSection ? "dark" : "light";
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
