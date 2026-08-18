import { MotionEffects } from "../effects/MotionEffects.js";

export class NavigationAnimator {
  setActiveButton(buttons, activeId) {
    buttons.forEach((button) => {
      const isActive = button.getAttribute("data-nav") === activeId;
      button.classList.toggle("nav-active", isActive);
    });
  }

  press(button) {
    if (!button) return;
    MotionEffects.animate(220, (eased, raw) => {
      const scale = raw < 0.5 ? 1 + (eased * 0.035) : 1 + ((1 - eased) * 0.035);
      button.style.setProperty("--nav-press-scale", scale.toFixed(3));
      if (raw >= 1) {
        button.style.removeProperty("--nav-press-scale");
      }
    }, MotionEffects.easeOutExpo);
  }
}
