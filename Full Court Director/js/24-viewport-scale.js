/* ======================================================
   FULL COURT DIRECTOR — GAME VIEWPORT SCALER
   Keeps the game locked to 1600x900 and scales to fit.
====================================================== */

const FCD_VIEWPORT_WIDTH = 1600;
const FCD_VIEWPORT_HEIGHT = 900;

function updateFullCourtDirectorViewportScale() {
  const browserWidth = window.innerWidth || document.documentElement.clientWidth;
  const browserHeight = window.innerHeight || document.documentElement.clientHeight;

  const widthScale = browserWidth / FCD_VIEWPORT_WIDTH;
  const heightScale = browserHeight / FCD_VIEWPORT_HEIGHT;

  const scale = Math.min(widthScale, heightScale);

  const scaledWidth = FCD_VIEWPORT_WIDTH * scale;
  const scaledHeight = FCD_VIEWPORT_HEIGHT * scale;

  const left = Math.max(0, (browserWidth - scaledWidth) / 2);
  const top = Math.max(0, (browserHeight - scaledHeight) / 2);

  document.documentElement.style.setProperty("--fcd-scale", String(scale));
  document.documentElement.style.setProperty("--fcd-left", `${left}px`);
  document.documentElement.style.setProperty("--fcd-top", `${top}px`);
}

window.addEventListener("resize", updateFullCourtDirectorViewportScale);
window.addEventListener("orientationchange", updateFullCourtDirectorViewportScale);
document.addEventListener("DOMContentLoaded", updateFullCourtDirectorViewportScale);
window.addEventListener("load", updateFullCourtDirectorViewportScale);

updateFullCourtDirectorViewportScale();