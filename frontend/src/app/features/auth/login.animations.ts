import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export const loginAnimations = [
  trigger('fadeUp', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(16px)' }),
      animate('500ms 100ms cubic-bezier(0.16, 1, 0.3, 1)',
        style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]),
  trigger('staggerFade', [
    transition(':enter', [
      query('.hero-eyebrow, .hero-title, .hero-sub, .stats-strip, .quote-strip', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        stagger(80, [
          animate('600ms cubic-bezier(0.16, 1, 0.3, 1)',
            style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ], { optional: true })
    ])
  ]),
  trigger('slideDown', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(-6px)', maxHeight: '0' }),
      animate('200ms cubic-bezier(0.16, 1, 0.3, 1)',
        style({ opacity: 1, transform: 'translateY(0)', maxHeight: '60px' }))
    ]),
    transition(':leave', [
      animate('150ms ease-in',
        style({ opacity: 0, transform: 'translateY(-4px)', maxHeight: '0' }))
    ])
  ]),
];
