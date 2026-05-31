import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { trigger, transition, style, query, animate, group } from '@angular/animations';
import { ToastContainerComponent } from './shared/toast/toast-container.component';
import { CmdPaletteComponent } from './shared/cmd-palette/cmd-palette.component';

export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        opacity: 0,
        transform: 'translateY(8px)'
      })
    ], { optional: true }),
    group([
      query(':leave', [
        animate('150ms ease-out', style({ opacity: 0, transform: 'translateY(-8px)' }))
      ], { optional: true }),
      query(':enter', [
        animate('250ms 50ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ], { optional: true })
    ])
  ])
]);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, CmdPaletteComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [routeAnimations]
})
export class AppComponent {
  title = 'frontend';

  prepareRoute(outlet: RouterOutlet): string {
    return outlet && outlet.isActivated ? outlet.activatedRoute.routeConfig?.path || '' : '';
  }
}
