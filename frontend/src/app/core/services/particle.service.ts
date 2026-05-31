import { Injectable, OnDestroy } from '@angular/core';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

@Injectable()
export class ParticleService implements OnDestroy {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId!: number;
  private resizeObserver!: ResizeObserver;

  readonly CONFIG = {
    count:          60,
    speed:          0.22,
    connectionDist: 100,    // px — draw line if closer than this
    lineOpacity:    0.12,
    dotOpacityMin:  0.15,
    dotOpacityMax:  0.55,
    sizeMin:        0.4,
    sizeMax:        1.8,
  };

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d')!;
    this.resize();
    this.spawnParticles();

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.draw();
      return;
    }

    this.loop();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement!);
  }

  private resize(): void {
    const parent = this.canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    
    // Set display size
    this.canvas.style.width = parent.offsetWidth + 'px';
    this.canvas.style.height = parent.offsetHeight + 'px';
    
    // Set actual resolution
    this.canvas.width  = parent.offsetWidth * dpr;
    this.canvas.height = parent.offsetHeight * dpr;
    
    this.ctx.scale(dpr, dpr);

    // Adjust particle count for mobile
    if (window.matchMedia('(max-width: 900px)').matches) {
      this.CONFIG.count = 30;
    } else {
      this.CONFIG.count = 60;
    }
  }

  private spawnParticles(): void {
    const { count, speed, dotOpacityMin, dotOpacityMax, sizeMin, sizeMax } = this.CONFIG;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.particles = Array.from({ length: count }, () => ({
      x:     Math.random() * width,
      y:     Math.random() * height,
      vx:    (Math.random() - 0.5) * speed * 2,
      vy:    (Math.random() - 0.5) * speed * 2,
      size:  Math.random() * (sizeMax - sizeMin) + sizeMin,
      alpha: Math.random() * (dotOpacityMax - dotOpacityMin) + dotOpacityMin,
    }));
  }

  private loop = (): void => {
    this.update();
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width)  p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    });
  }

  private getAccentColor(): string {
    const accentHex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    if (accentHex.startsWith('#')) {
      const r = parseInt(accentHex.slice(1, 3), 16);
      const g = parseInt(accentHex.slice(3, 5), 16);
      const b = parseInt(accentHex.slice(5, 7), 16);
      return `${r},${g},${b}`;
    }
    return '99,179,237'; // default fallback
  }

  private draw(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const { lineOpacity, connectionDist } = this.CONFIG;
    const dotColor = this.getAccentColor();
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    // Connection lines
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx   = this.particles[i].x - this.particles[j].x;
        const dy   = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < connectionDist) {
          const alpha = lineOpacity * (1 - dist / connectionDist);
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${dotColor}, ${alpha.toFixed(3)})`;
          ctx.lineWidth   = 0.4;
          ctx.moveTo(this.particles[i].x, this.particles[i].y);
          ctx.lineTo(this.particles[j].x, this.particles[j].y);
          ctx.stroke();
        }
      }
    }

    // Dots
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotColor}, ${p.alpha})`;
      ctx.fill();
    });
  }

  ngOnDestroy(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
