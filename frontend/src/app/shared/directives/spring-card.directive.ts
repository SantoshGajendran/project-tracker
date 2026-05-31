import { Directive, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { SpringPhysicsService } from '../../core/services/spring-physics.service';

@Directive({
  selector: '[appSpringCard]',
  standalone: true
})
export class SpringCardDirective implements OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private spring = inject(SpringPhysicsService);

  @HostListener('mouseenter')
  onHover(): void {
    const el = this.el.nativeElement;
    // Skip animation if dragging or active
    if (el.classList.contains('cdk-drag-dragging')) return;
    
    this.spring.animate(el, '--card-lift', 0, -4, this.spring.CONFIGS.snappy);
    this.spring.animate(el, '--card-scale', 1, 1.02, this.spring.CONFIGS.snappy);
  }

  @HostListener('mouseleave')
  onLeave(): void {
    const el = this.el.nativeElement;
    if (el.classList.contains('cdk-drag-dragging')) return;

    this.spring.animate(el, '--card-lift', -4, 0, this.spring.CONFIGS.bouncy);
    this.spring.animate(el, '--card-scale', 1.02, 1, this.spring.CONFIGS.bouncy);
  }

  ngOnDestroy(): void {
    const el = this.el.nativeElement;
    this.spring.cancel(el, '--card-lift');
    this.spring.cancel(el, '--card-scale');
  }
}
