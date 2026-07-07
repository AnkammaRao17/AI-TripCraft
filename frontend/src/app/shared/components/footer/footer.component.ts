import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="app-footer">
      <div class="footer-content">
        <p>&copy; {{ currentYear }} AI TripCraft – Smart AI Travel Itinerary Planner. All rights reserved.</p>
        <div class="footer-links">
          <a href="#" class="footer-link">Privacy Policy</a>
          <a href="#" class="footer-link">Terms of Service</a>
          <a href="#" class="footer-link">Support</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background: var(--bg-secondary);
      border-top: 1px solid var(--border-color);
      padding: 20px 24px;
      margin-top: 40px;
      color: var(--text-secondary);
      font-size: 13px;
    }
    .footer-content {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      justify-content: space-between;
      @media (min-width: 768px) {
        flex-direction: row;
      }
    }
    .footer-links {
      display: flex;
      gap: 16px;
    }
    .footer-link {
      color: var(--text-muted);
      text-decoration: none;
      transition: color 0.2s ease;
      &:hover {
        color: var(--accent-primary);
      }
    }
  `],
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
