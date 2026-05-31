import { Injectable } from '@angular/core';

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
  precision: number;
}

interface SpringState {
  position: number;
  velocity: number;
}

@Injectable({
  providedIn: 'root'
})
export class SpringPhysicsService {
  private rafId: Map<string, number> = new Map();

  readonly CONFIGS = {
    snappy: { stiffness: 280, damping: 22, mass: 1, precision: 0.01 },
    bouncy: { stiffness: 180, damping: 10, mass: 1, precision: 0.01 },
    gentle: { stiffness: 120, damping: 14, mass: 1.2, precision: 0.01 },
    instant: { stiffness: 400, damping: 30, mass: 0.8, precision: 0.005 }
  };

  /**
   * Animate a CSS custom property from its current value to a target
   */
  animate(
    el: HTMLElement,
    prop: string,
    from: number,
    to: number,
    config: SpringConfig = this.CONFIGS.snappy,
    onDone?: () => void
  ): void {
    const key = `${this.getElementId(el)}-${prop}`;
    this.cancelKey(key);

    const state: SpringState = { position: from, velocity: 0 };
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.064);
      lastTime = now;

      const displacement = state.position - to;
      const springForce = -config.stiffness * displacement;
      const dampingForce = -config.damping * state.velocity;
      const acceleration = (springForce + dampingForce) / config.mass;

      state.velocity += acceleration * dt;
      state.position += state.velocity * dt;

      el.style.setProperty(prop, String(state.position));

      const atRest =
        Math.abs(state.velocity) < config.precision &&
        Math.abs(state.position - to) < config.precision;

      if (atRest) {
        el.style.setProperty(prop, String(to));
        this.rafId.delete(key);
        onDone?.();
      } else {
        this.rafId.set(key, requestAnimationFrame(tick));
      }
    };

    this.rafId.set(key, requestAnimationFrame(tick));
  }

  /** Cancel animation for a specific property on an element */
  cancel(el: HTMLElement, prop: string): void {
    const key = `${this.getElementId(el)}-${prop}`;
    this.cancelKey(key);
  }

  /** Cancel all animations on an element */
  cancelAll(el: HTMLElement, props: string[]): void {
    props.forEach(prop => this.cancel(el, prop));
  }

  private cancelKey(key: string): void {
    const id = this.rafId.get(key);
    if (id !== undefined) {
      cancelAnimationFrame(id);
      this.rafId.delete(key);
    }
  }

  /** Animate multiple properties simultaneously */
  animateMulti(
    el: HTMLElement,
    targets: Record<string, { from: number; to: number }>,
    config: SpringConfig = this.CONFIGS.snappy,
    onDone?: () => void
  ): void {
    const props = Object.keys(targets);
    let settled = 0;

    props.forEach(prop => {
      this.animate(
        el,
        prop,
        targets[prop].from,
        targets[prop].to,
        config,
        () => {
          settled++;
          if (settled === props.length && onDone) {
            onDone();
          }
        }
      );
    });
  }

  private getElementId(el: HTMLElement): string {
    if (!el.id) {
      el.id = `spring-el-${Math.random().toString(36).substring(2, 9)}`;
    }
    return el.id;
  }
}
