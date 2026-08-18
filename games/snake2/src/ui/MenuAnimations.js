import { MotionEffects } from "../effects/MotionEffects.js";

export class MenuAnimations {
  static revealCards(elements) {
    elements.forEach((el, index) => {
      el.style.opacity = "0";
      MotionEffects.animate(
        520 + (index * 70),
        (eased, raw) => {
          el.style.opacity = String(eased);
          el.style.transform = `translateY(${(1 - eased) * 20}px) scale(${0.97 + eased * 0.03})`;
          if (raw >= 1) {
            el.style.opacity = "";
            el.style.transform = "";
          }
        },
        MotionEffects.easeOutExpo
      );
    });
  }

  static pulse(element) {
    MotionEffects.animate(260, (eased, raw) => {
      const scale = raw < 0.5 ? 1 + (eased * 0.04) : 1 + ((1 - eased) * 0.04);
      element.style.setProperty("--tap-scale", String(scale));
      if (raw >= 1) {
        element.style.removeProperty("--tap-scale");
      }
    });
  }
}
