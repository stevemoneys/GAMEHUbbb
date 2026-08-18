export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  addScaled(vec, scale) {
    this.x += vec.x * scale;
    this.y += vec.y * scale;
    return this;
  }
}
