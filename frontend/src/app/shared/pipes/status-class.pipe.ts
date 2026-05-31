import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusClass',
  standalone: true
})
export class StatusClassPipe implements PipeTransform {
  transform(value: string | undefined): string {
    if (!value) return '';
    const norm = value.toUpperCase().trim();
    switch (norm) {
      // Statuses
      case 'PLANNING':
        return 'status-planning';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'ON_HOLD':
        return 'status-on-hold';
      case 'COMPLETED':
      case 'DONE':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      case 'TODO':
        return 'status-todo';
      case 'IN_REVIEW':
        return 'status-in-review';
        
      // Priorities
      case 'LOW':
        return 'priority-low';
      case 'MEDIUM':
        return 'priority-medium';
      case 'HIGH':
        return 'priority-high';
      case 'CRITICAL':
        return 'priority-critical';
        
      default:
        return 'status-unknown';
    }
  }
}
