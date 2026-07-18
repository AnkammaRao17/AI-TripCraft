import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

import { TripService } from '../../core/services/trip.service';
import { AiService } from '../../core/services/ai.service';
import { NotificationService } from '../../core/services/notification.service';
import { Trip, Itinerary } from '../../models/interfaces';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-itinerary-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './itinerary-view.component.html',
  styleUrls: ['./itinerary-view.component.scss']
})
export class ItineraryViewComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  private aiService = inject(AiService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private http = inject(HttpClient);

  // Signals
  trip = signal<Trip | null>(null);
  itinerary = signal<Itinerary | null>(null);
  weatherData = signal<any | null>(null);
  isLoading = signal(true);
  isWeatherLoading = signal(true);
  isFavorited = signal(false);

  // Tabs & Checklist Signals
  activeTab = signal<'schedule' | 'packing' | 'hotels' | 'restaurants' | 'attractions' | 'tips'>('schedule');
  packingItems = signal<{ name: string; checked: boolean }[]>([]);
  customPackingItem = signal<string>('');

  // Inline Editing Day Signals
  editingDay = signal<number | null>(null);
  editMorningPlan = signal<string>('');
  editAfternoonPlan = signal<string>('');
  editEveningPlan = signal<string>('');
  editDailyBudget = signal<number>(0);
  editTransitTips = signal<string>('');

  // Tips Signal
  newTravelTip = signal<string>('');

  // Spacing and layout helpers
  detailedBudget = computed(() => {
    const t = this.trip();
    if (!t) return null;
    
    const hotel = t.estimatedBudgetBreakdown?.hotelCost || 0;
    const food = t.estimatedBudgetBreakdown?.foodCost || 0;
    const transport = t.estimatedBudgetBreakdown?.transportCost || 0;
    const tickets = t.estimatedBudgetBreakdown?.attractionsCost || 0;
    
    const shopping = Math.round(t.estimatedBudgetBreakdown?.total * 0.15);
    const emergency = Math.round(t.estimatedBudgetBreakdown?.total * 0.10);
    const taxes = Math.round((hotel + food) * 0.05);
    const grandTotal = hotel + food + transport + tickets + shopping + emergency + taxes;
    
    return {
      hotel,
      food,
      transport,
      tickets,
      shopping,
      emergency,
      taxes,
      grandTotal
    };
  });

  enrichedHotels = computed(() => {
    const list = this.itinerary()?.hotels || [];
    const destination = this.trip()?.destination || 'Destination';
    
    const hotelImages = [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80'
    ];
    
    const fallbackNames = [
      `Grand Hyatt Luxury Suites`,
      `Taj Heritage Palace & Spa`,
      `Boutique Garden Resorts`
    ];

    const namesToUse = list.length > 0 ? list : fallbackNames;

    return namesToUse.map((name, idx) => {
      const rating = (4.5 + (idx * 0.15) % 0.5).toFixed(1);
      const tier = this.trip()?.budget || 'Moderate';
      let price = 4500;
      if (tier === 'Budget') price = 1500 + (idx * 500);
      else if (tier === 'Luxury') price = 12000 + (idx * 3000);
      else price = 4500 + (idx * 1500);

      const amenities = idx % 2 === 0 
        ? ['Free Wi-Fi', 'Outdoor Pool', 'Spa', 'Restaurant', 'AC']
        : ['Free Breakfast', 'Gym', 'Bar', 'Room Service', 'AC'];

      return {
        name,
        imageUrl: hotelImages[idx % hotelImages.length],
        rating,
        price,
        amenities,
        distance: `${(1.2 + idx * 0.8).toFixed(1)} km from tourist hub`
      };
    });
  });

  enrichedRestaurants = computed(() => {
    const itin = this.itinerary();
    if (!itin) return [];

    const foodImages = [
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
    ];

    const allNames: string[] = [];
    itin.days.forEach(day => {
      day.restaurants.forEach(r => {
        if (!allNames.includes(r)) allNames.push(r);
      });
    });

    if (allNames.length === 0) {
      allNames.push('Punjabi Kadhai', 'Saffron Fine Dine', 'Local Street Treat Spot');
    }

    const cuisines = ['North Indian Special, Tandoori', 'South Indian Deluxe, Vegetarian', 'Continental & Indian Fusion'];

    return allNames.map((name, idx) => {
      const rating = (4.3 + (idx * 0.12) % 0.6).toFixed(1);
      const hours = '11:00 AM - 11:30 PM';
      const price = 350 + (idx * 150);
      return {
        name,
        imageUrl: foodImages[idx % foodImages.length],
        cuisine: cuisines[idx % cuisines.length],
        rating,
        hours,
        price,
        distance: `${(0.8 + idx * 0.5).toFixed(1)} km`
      };
    });
  });

  enrichedAttractions = computed(() => {
    const itin = this.itinerary();
    if (!itin) return [];

    const attrImages = [
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=600&q=80'
    ];

    const allNames: string[] = [];
    itin.days.forEach(day => {
      day.recommendedAttractions.forEach(attr => {
        if (!allNames.includes(attr)) allNames.push(attr);
      });
    });

    if (allNames.length === 0) {
      allNames.push('Heritage Fort Landmark', 'Craft & Bazaar Market', 'Golden Scenic Viewpoint');
    }

    return allNames.map((name, idx) => {
      return {
        name,
        imageUrl: attrImages[idx % attrImages.length],
        history: 'A classic heritage landmark representing the deep roots, culture and ancient architecture of the region.',
        hours: '09:00 AM - 06:00 PM',
        fee: idx % 2 === 0 ? '₹150 per person' : 'Free entry for all',
        timeRequired: '2 - 3 Hours',
        bestTime: 'Morning or late afternoon',
        distance: `${(1.5 + idx * 1.1).toFixed(1)} km`
      };
    });
  });

  routeSegments = computed(() => {
    const itin = this.itinerary();
    if (!itin) return [];

    return itin.days.map((day) => {
      const hotel = 'Hotel Stay';
      const attraction1 = day.recommendedAttractions[0] || 'Local Landmark';
      const lunch = day.restaurants[0] || 'Spice Villa Bistro';
      const attraction2 = day.recommendedAttractions[1] || 'Sunset Garden';
      
      return [
        { from: hotel, to: attraction1, distance: '2.4 km', duration: '8 mins', mode: 'Auto Rickshaw' },
        { from: attraction1, to: lunch, distance: '1.1 km', duration: '5 mins', mode: 'Walk' },
        { from: lunch, to: attraction2, distance: '3.8 km', duration: '12 mins', mode: 'Cab Ride' }
      ];
    });
  });

  openNavigation(from: string, to: string): void {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`;
    window.open(url, '_blank');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadTripDetails(id);
    } else {
      this.router.navigate(['/dashboard']);
    }

    this.aiService.itineraryModified$.subscribe(() => {
      const activeId = this.route.snapshot.params['id'];
      if (activeId) {
        this.loadTripDetails(activeId);
      }
    });
  }

  loadTripDetails(id: string): void {
    this.isLoading.set(true);
    this.tripService.getTrip(id).subscribe({
      next: (res) => {
        this.trip.set(res.data.trip);
        this.itinerary.set(res.data.itinerary);
        this.isFavorited.set(res.data.isFavorited);
        
        // Populate packing checklist from itinerary response
        const list = res.data.itinerary?.packingList || [];
        this.packingItems.set(list.map((item: string) => ({ name: item, checked: false })));

        this.isLoading.set(false);
        
        // Trigger weather load
        this.loadWeather(id);

        // Celebrating successful generation with confetti
        const createdTime = res.data?.trip?.createdAt ? new Date(res.data.trip.createdAt).getTime() : 0;
        const diff = Date.now() - createdTime;
        if (createdTime > 0 && diff < 20000) {
          this.triggerConfetti();
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load trip details.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  loadWeather(id: string): void {
    this.isWeatherLoading.set(true);
    this.tripService.getTripWeather(id).subscribe({
      next: (res) => {
        this.weatherData.set(res.data);
        this.isWeatherLoading.set(false);
      },
      error: () => {
        this.isWeatherLoading.set(false);
      }
    });
  }

  toggleFavorite(): void {
    const t = this.trip();
    if (!t) return;

    this.tripService.toggleFavorite(t._id).subscribe({
      next: (res) => {
        this.isFavorited.set(res.data.isFavorited);
        this.notification.success(res.message);
      }
    });
  }

  duplicateTrip(): void {
    const t = this.trip();
    if (!t) return;

    this.tripService.duplicateTrip(t._id).subscribe({
      next: (res) => {
        this.notification.success('Trip duplicated successfully!');
        this.router.navigate(['/itinerary', res.data.trip._id]);
      },
      error: () => this.notification.error('Failed to duplicate trip.')
    });
  }

  deleteTrip(): void {
    const t = this.trip();
    if (!t) return;

    if (confirm('Are you sure you want to delete this trip and its itinerary?')) {
      this.tripService.deleteTrip(t._id).subscribe({
        next: () => {
          this.notification.success('Trip deleted successfully.');
          this.router.navigate(['/dashboard']);
        },
        error: () => this.notification.error('Failed to delete trip.')
      });
    }
  }

  downloadPDF(): void {
    const t = this.trip();
    if (!t) {
      this.notification.warning('Itinerary data not fully loaded.');
      return;
    }

    this.notification.info('Compiling your premium PDF brochure on backend...');

    this.http.get(`${environment.apiUrl}/trips/${t._id}/pdf`, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const cleanDest = t.destination.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `AITripCraft_${cleanDest}.pdf`;
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.notification.success('PDF downloaded successfully!');
      },
      error: (err) => {
        console.error(err);
        this.notification.error('Failed to download PDF. Please try again.');
      }
    });
  }

  addPackingItem(): void {
    const item = this.customPackingItem().trim();
    if (!item) return;
    this.packingItems.update(prev => [...prev, { name: item, checked: false }]);
    this.customPackingItem.set('');
    this.notification.success('Custom item added to packing list!');
  }

  removePackingItem(index: number): void {
    this.packingItems.update(prev => prev.filter((_, i) => i !== index));
    this.notification.success('Item removed from packing list.');
  }

  togglePackingItem(index: number): void {
    this.packingItems.update(prev => prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item));
  }

  startEditDay(day: any): void {
    this.editingDay.set(day.dayNumber);
    this.editMorningPlan.set(day.morningPlan);
    this.editAfternoonPlan.set(day.afternoonPlan);
    this.editEveningPlan.set(day.eveningPlan);
    this.editDailyBudget.set(day.estimatedDailyBudget);
    this.editTransitTips.set(day.transportationTips || '');
  }

  saveEditDay(dayNumber: number): void {
    const t = this.trip();
    if (!t) return;

    const dayPlan = {
      morningPlan: this.editMorningPlan(),
      afternoonPlan: this.editAfternoonPlan(),
      eveningPlan: this.editEveningPlan(),
      estimatedDailyBudget: this.editDailyBudget(),
      transportationTips: this.editTransitTips(),
      recommendedAttractions: this.itinerary()?.days.find(d => d.dayNumber === dayNumber)?.recommendedAttractions || [],
      restaurants: this.itinerary()?.days.find(d => d.dayNumber === dayNumber)?.restaurants || [],
      localFood: this.itinerary()?.days.find(d => d.dayNumber === dayNumber)?.localFood || [],
    };

    this.tripService.updateItineraryDay(t._id, dayNumber, dayPlan).subscribe({
      next: () => {
        this.notification.success(`Day ${dayNumber} plan updated successfully!`);
        this.editingDay.set(null);
        this.loadTripDetails(t._id);
      },
      error: () => this.notification.error('Failed to update day plan.')
    });
  }

  addTravelTip(): void {
    const tip = this.newTravelTip().trim();
    const t = this.trip();
    const itin = this.itinerary();
    if (!tip || !t || !itin) return;

    const updatedTips = [...(itin.travelTips || []), tip];
    this.tripService.updateItineraryTips(t._id, updatedTips).subscribe({
      next: () => {
        this.newTravelTip.set('');
        this.notification.success('Travel tip added successfully!');
        this.loadTripDetails(t._id);
      },
      error: () => this.notification.error('Failed to add travel tip.')
    });
  }

  removeTravelTip(index: number): void {
    const t = this.trip();
    const itin = this.itinerary();
    if (!t || !itin) return;

    const updatedTips = (itin.travelTips || []).filter((_, i) => i !== index);
    this.tripService.updateItineraryTips(t._id, updatedTips).subscribe({
      next: () => {
        this.notification.success('Travel tip removed successfully.');
        this.loadTripDetails(t._id);
      },
      error: () => this.notification.error('Failed to remove travel tip.')
    });
  }

  triggerConfetti(): void {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#6366f1', '#a855f7', '#ec4899', '#10b981', '#f59e0b'];
    const particles: any[] = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.4,
        angle: Math.random() * Math.PI * 2,
        speed: 5 + Math.random() * 15,
        radius: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: 1,
        decay: 0.015 + Math.random() * 0.02,
        gravity: 0.4
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach(p => {
        if (p.opacity > 0) {
          p.x += Math.cos(p.angle) * p.speed;
          p.y += Math.sin(p.angle) * p.speed + p.gravity;
          p.opacity -= p.decay;
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity;
          ctx.fill();
          
          alive = true;
        }
      });

      if (alive) {
        requestAnimationFrame(animate);
      } else {
        if (document.body.contains(canvas)) {
          document.body.removeChild(canvas);
        }
      }
    };

    animate();
  }
}
