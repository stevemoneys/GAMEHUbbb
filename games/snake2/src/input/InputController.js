const keyMap = {
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right"
};

export class InputController {
  constructor({ canvas, touchButtons, onDirection }) {
    this.canvas = canvas;
    this.touchButtons = touchButtons;
    this.onDirection = onDirection;
    this.touchStart = null;
    this.minSwipe = 18;
    this.bufferSize = 2;
    this.directionBuffer = [];
    this.pointerActive = false;
  }

  bind() {
    window.addEventListener("keydown", (event) => {
      const dir = keyMap[event.code];
      if (!dir) return;
      event.preventDefault();
      this.#pushDirection(dir);
    });

    this.touchButtons.forEach((btn) => {
      btn.addEventListener("pointerdown", (event) => {
        const dir = event.currentTarget.dataset.dir;
        if (dir) this.#pushDirection(dir);
      });
    });

    this.canvas.addEventListener("touchstart", (event) => {
      const touch = event.changedTouches[0];
      this.touchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: true });

    this.canvas.addEventListener("touchend", (event) => {
      if (!this.touchStart) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - this.touchStart.x;
      const dy = touch.clientY - this.touchStart.y;
      this.touchStart = null;

      if (Math.abs(dx) < this.minSwipe && Math.abs(dy) < this.minSwipe) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.#pushDirection(dx > 0 ? "right" : "left");
      } else {
        this.#pushDirection(dy > 0 ? "down" : "up");
      }
    }, { passive: true });

    this.canvas.addEventListener("pointerdown", (event) => {
      this.pointerActive = true;
      this.touchStart = { x: event.clientX, y: event.clientY };
    });

    this.canvas.addEventListener("pointermove", (event) => {
      if (!this.pointerActive || !this.touchStart) return;
      const dx = event.clientX - this.touchStart.x;
      const dy = event.clientY - this.touchStart.y;
      if (Math.abs(dx) < this.minSwipe && Math.abs(dy) < this.minSwipe) return;
      this.#pushVector(dx, dy);
      this.touchStart = { x: event.clientX, y: event.clientY };
    });

    this.canvas.addEventListener("pointerup", () => {
      this.pointerActive = false;
      this.touchStart = null;
    });

    this.canvas.addEventListener("pointercancel", () => {
      this.pointerActive = false;
      this.touchStart = null;
    });
  }

  setBufferSize(nextSize) {
    if (!Number.isFinite(nextSize)) return;
    this.bufferSize = Math.max(1, Math.floor(nextSize));
    if (this.directionBuffer.length > this.bufferSize) {
      this.directionBuffer = this.directionBuffer.slice(-this.bufferSize);
    }
  }

  consumeBufferedDirections() {
    while (this.directionBuffer.length > 0) {
      this.onDirection(this.directionBuffer.shift());
    }
  }

  clearBuffer() {
    this.directionBuffer.length = 0;
  }

  #pushDirection(dir) {
    const lastBuffered = this.directionBuffer[this.directionBuffer.length - 1];
    if (lastBuffered === dir) return;
    this.directionBuffer.push(dir);
    if (this.directionBuffer.length > this.bufferSize) {
      this.directionBuffer.shift();
    }
  }

  #pushVector(dx, dy) {
    if (Math.abs(dx) > Math.abs(dy)) {
      this.#pushDirection(dx > 0 ? "right" : "left");
    } else {
      this.#pushDirection(dy > 0 ? "down" : "up");
    }
  }
}
