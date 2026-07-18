import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';
import { getDestinationImageUrl, getNextDestinationImageUrl } from '../../shared/constants/destination-images';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);

  activeDemoTab = signal<'itinerary' | 'budget' | 'weather'>('itinerary');
  activeFaqIndex = signal<number | null>(null);

  toggleFaq(index: number): void {
    if (this.activeFaqIndex() === index) {
      this.activeFaqIndex.set(null);
    } else {
      this.activeFaqIndex.set(index);
    }
  }

  setDemoTab(tab: 'itinerary' | 'budget' | 'weather'): void {
    this.activeDemoTab.set(tab);
  }

  // Handle image error in landing featured grid
  onImgError(event: any, name?: string): void {
    const currentUrl = event.target.src;
    const destName = name || 'Destination';
    const nextUrl = getNextDestinationImageUrl(currentUrl, destName);
    if (event.target.src !== nextUrl) {
      event.target.src = nextUrl;
    }
  }

  featuredDestinations = [
    {
      name: 'Goa',
      state: 'Goa',
      description: 'Sun-kissed beaches, vibrant nightlife, and historic Portuguese colonial architecture.',
      rating: 4.8,
      imageUrl: getDestinationImageUrl('Goa')
    },
    {
      name: 'Jaipur',
      state: 'Rajasthan',
      description: 'The Pink City. Historic royal palaces, majestic hill forts, and brilliant bazaars.',
      rating: 4.7,
      imageUrl: getDestinationImageUrl('Jaipur')
    },
    {
      name: 'Manali',
      state: 'Himachal Pradesh',
      description: 'Adventure capital of the north, perched in snow-capped mountains and valleys.',
      rating: 4.6,
      imageUrl: getDestinationImageUrl('Manali')
    },
    {
      name: 'Kashmir',
      state: 'Jammu & Kashmir',
      description: 'Paradise on Earth. Shikaras on Dal Lake, snow meadows, and picturesque valleys.',
      rating: 4.9,
      imageUrl: getDestinationImageUrl('Kashmir')
    },
    {
      name: 'Kerala',
      state: 'Kerala',
      description: 'God\'s Own Country. Serene backwater houseboats, spice hills, and wild beaches.',
      rating: 4.8,
      imageUrl: getDestinationImageUrl('Kerala')
    },
    {
      name: 'Munnar',
      state: 'Kerala',
      description: 'Emerald green tea plantations, mist-draped valleys, and cool mountain air.',
      rating: 4.7,
      imageUrl: getDestinationImageUrl('Munnar')
    }
  ];

  ngOnInit(): void {
    // If user is logged in, redirect them to dashboard
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  getStarted(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/trip-builder']);
    } else {
      this.router.navigate(['/auth/register']);
    }
  }
}
