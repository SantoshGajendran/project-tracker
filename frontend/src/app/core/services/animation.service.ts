import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {

  /**
   * Animates a numeric counter from 0 to target value on element
   */
  countUp(element: HTMLElement, targetValue: number, duration: number = 1000): void {
    if (!element) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const currentValue = Math.floor(progress * targetValue);
      element.textContent = currentValue.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.textContent = targetValue.toLocaleString();
      }
    };
    window.requestAnimationFrame(step);
  }

  /**
   * Applies inline staggered delays to a list of HTML elements
   */
  staggerList(elements: HTMLElement[] | HTMLCollection | null, baseDelay: number = 50): void {
    if (!elements) return;
    const items = Array.from(elements) as HTMLElement[];
    items.forEach((el, index) => {
      el.style.animationDelay = `${index * baseDelay}ms`;
      el.classList.add('animate-enter');
    });
  }

  /**
   * Creates a custom high-fidelity ripple effect inside an element
   */
  ripple(event: MouseEvent, element: HTMLElement): void {
    if (!element) return;
    
    // Ensure element has positioning
    const style = window.getComputedStyle(element);
    if (style.position === 'static') {
      element.style.position = 'relative';
    }
    if (style.overflow !== 'hidden') {
      element.style.overflow = 'hidden';
    }

    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rippleSpan = document.createElement('span');
    rippleSpan.style.position = 'absolute';
    rippleSpan.style.borderRadius = '50%';
    rippleSpan.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    rippleSpan.style.transform = 'scale(0)';
    rippleSpan.style.pointerEvents = 'none';
    
    // Set size to cover entire element
    const size = Math.max(rect.width, rect.height) * 2;
    rippleSpan.style.width = `${size}px`;
    rippleSpan.style.height = `${size}px`;
    rippleSpan.style.left = `${x - size / 2}px`;
    rippleSpan.style.top = `${y - size / 2}px`;

    // Apply animation via CSS transition
    rippleSpan.style.transition = 'transform 450ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 450ms ease-out';
    element.appendChild(rippleSpan);

    // Force reflow and apply scales
    requestAnimationFrame(() => {
      rippleSpan.style.transform = 'scale(1)';
    });

    // Fade out and remove
    setTimeout(() => {
      rippleSpan.style.opacity = '0';
      setTimeout(() => {
        rippleSpan.remove();
      }, 450);
    }, 150);
  }
}
