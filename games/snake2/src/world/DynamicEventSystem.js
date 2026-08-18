const EVENT_LIBRARY = [
  {
    type: "lightning_storm",
    title: "Lightning Storm",
    duration: 7.5,
    tint: "rgba(166, 229, 255, 0.1)",
    gameplay: {
      player: { turnRateMultiplier: 1.02 },
      ai: { turnRateMultiplier: 0.96, accelerationMultiplier: 0.95 }
    }
  },
  {
    type: "meteor_shower",
    title: "Meteor Shower",
    duration: 6.8,
    tint: "rgba(255, 201, 143, 0.08)",
    gameplay: {
      player: { speedMultiplier: 1.02 },
      ai: { speedMultiplier: 1.01 }
    }
  },
  {
    type: "corruption_wave",
    title: "Corruption Wave",
    duration: 7.2,
    tint: "rgba(215, 124, 255, 0.08)",
    gameplay: {
      player: { growthMultiplier: 1.08, turnRateMultiplier: 0.96 },
      ai: { turnRateMultiplier: 0.9 }
    }
  },
  {
    type: "ice_storm",
    title: "Ice Storm",
    duration: 6.4,
    tint: "rgba(166, 243, 255, 0.08)",
    gameplay: {
      player: { turnRateMultiplier: 0.98 },
      ai: { speedMultiplier: 0.88, turnRateMultiplier: 0.86, accelerationMultiplier: 0.9 }
    }
  },
  {
    type: "solar_eruption",
    title: "Solar Eruption",
    duration: 5.8,
    tint: "rgba(255, 152, 91, 0.08)",
    gameplay: {
      player: { speedMultiplier: 1.04, accelerationMultiplier: 1.06 },
      ai: { speedMultiplier: 1.02 }
    }
  },
  {
    type: "crystal_eruption",
    title: "Crystal Eruption",
    duration: 6.5,
    tint: "rgba(255, 180, 238, 0.08)",
    gameplay: {
      player: { growthMultiplier: 1.12 },
      ai: { growthMultiplier: 1.06 }
    }
  }
];

export class DynamicEventSystem {
  constructor() {
    this.timer = 0;
    this.nextEventAt = 13;
    this.activeEvent = null;
  }

  update(dt, context = {}) {
    this.timer += dt;
    if (this.activeEvent) {
      this.activeEvent.remaining -= dt;
      if (this.activeEvent.remaining <= 0) {
        this.activeEvent = null;
        this.nextEventAt = this.timer + 12 + Math.random() * 11;
      }
      return this.activeEvent;
    }

    if (this.timer >= this.nextEventAt) {
      const pick = EVENT_LIBRARY[Math.floor(Math.random() * EVENT_LIBRARY.length)];
      this.activeEvent = {
        ...pick,
        remaining: pick.duration
      };
    }

    return this.activeEvent;
  }

  getActiveEvent() {
    return this.activeEvent;
  }
}
