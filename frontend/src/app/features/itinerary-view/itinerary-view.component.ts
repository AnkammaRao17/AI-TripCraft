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

interface DestinationImageSet {
  hotels: string[];
  restaurants: string[];
  attractions: string[];
}

const DESTINATION_SPECIFIC_IMAGES: Record<string, DestinationImageSet> = {
  goa: {
    hotels: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1534080391095-71b14fa6b7ec?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=600&q=80'
    ]
  },
  manali: {
    hotels: [
      'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1605640840605-14ac1855827b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542401886-65d6c61db217?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=600&q=80'
    ]
  },
  jaipur: {
    hotels: [
      'https://images.unsplash.com/photo-1585983224974-084a8e065e76?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1598977123418-45f04b01f4ac?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80'
    ]
  },
  mumbai: {
    hotels: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80'
    ]
  },
  delhi: {
    hotels: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1585128792020-803d29415281?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506461883276-594a12b11db3?auto=format&fit=crop&w=600&q=80'
    ]
  },
  kerala: {
    hotels: [
      'https://images.unsplash.com/photo-1595928642581-f50f4f3453a5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1534080391095-71b14fa6b7ec?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80'
    ]
  },
  ladakh: {
    hotels: [
      'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1621252179027-94459d278660?auto=format&fit=crop&w=600&q=80'
    ]
  },
  hampi: {
    hotels: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507133750040-4a8f57021571?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1600100397607-ec4b8dfc62f5?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
    ]
  },
  varanasi: {
    hotels: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1598977123418-45f04b01f4ac?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80'
    ]
  },
  andaman: {
    hotels: [
      'https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80'
    ],
    restaurants: [
      'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
    ],
    attractions: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=600&q=80'
    ]
  }
};

const FALLBACK_SPECIFIC_IMAGES: DestinationImageSet = {
  hotels: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=600&q=80'
  ],
  restaurants: [
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'
  ],
  attractions: [
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=600&q=80'
  ]
};

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
    const destination = (this.trip()?.destination || '').toLowerCase().trim();
    
    let imgSet = FALLBACK_SPECIFIC_IMAGES;
    for (const key of Object.keys(DESTINATION_SPECIFIC_IMAGES)) {
      if (destination.includes(key)) {
        imgSet = DESTINATION_SPECIFIC_IMAGES[key];
        break;
      }
    }
    const hotelImages = imgSet.hotels;
    
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
    const destination = (this.trip()?.destination || '').toLowerCase().trim();

    let imgSet = FALLBACK_SPECIFIC_IMAGES;
    for (const key of Object.keys(DESTINATION_SPECIFIC_IMAGES)) {
      if (destination.includes(key)) {
        imgSet = DESTINATION_SPECIFIC_IMAGES[key];
        break;
      }
    }
    const foodImages = imgSet.restaurants;

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
    const destination = (this.trip()?.destination || '').toLowerCase().trim();

    let imgSet = FALLBACK_SPECIFIC_IMAGES;
    for (const key of Object.keys(DESTINATION_SPECIFIC_IMAGES)) {
      if (destination.includes(key)) {
        imgSet = DESTINATION_SPECIFIC_IMAGES[key];
        break;
      }
    }
    const attrImages = imgSet.attractions;

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
    const destination = (this.trip()?.destination || '').toLowerCase();

    // Map transportation options based on destination
    let mode1 = 'Auto Rickshaw';
    let mode2 = 'Walk';
    let mode3 = 'Cab Ride';
    let distMultiplier = 1.0;

    if (destination.includes('goa') || destination.includes('andaman')) {
      mode1 = 'Scooter Ride';
      mode2 = 'Walk on Beach';
      mode3 = 'Scooter Ride';
      distMultiplier = 2.0;
    } else if (destination.includes('ladakh')) {
      mode1 = 'SUV Drive';
      mode2 = 'Walk/Trek';
      mode3 = 'SUV Drive';
      distMultiplier = 12.0;
    } else if (destination.includes('manali')) {
      mode1 = 'Taxi Cab';
      mode2 = 'Walk';
      mode3 = 'Taxi Cab';
      distMultiplier = 4.0;
    } else if (destination.includes('delhi')) {
      mode1 = 'Metro Ride';
      mode2 = 'Rickshaw Walk';
      mode3 = 'Cab';
      distMultiplier = 3.5;
    } else if (destination.includes('mumbai')) {
      mode1 = 'Local Train';
      mode2 = 'Walk';
      mode3 = 'Taxi Cab';
      distMultiplier = 3.0;
    } else if (destination.includes('hampi')) {
      mode1 = 'Bicycle Ride';
      mode2 = 'Walk';
      mode3 = 'Bicycle Ride';
      distMultiplier = 0.8;
    } else if (destination.includes('varanasi')) {
      mode1 = 'Cycle Rickshaw';
      mode2 = 'Walk';
      mode3 = 'Boat Ride';
      distMultiplier = 0.9;
    }

    return itin.days.map((day, idx) => {
      const hotel = itin.hotels && itin.hotels[0] ? itin.hotels[0].split('(')[0].trim() : 'Hotel Stay';
      const attraction1 = day.recommendedAttractions[0] || 'Local Landmark';
      const lunch = day.restaurants[0] ? day.restaurants[0].split('(')[0].trim() : 'Local Diner';
      const attraction2 = day.recommendedAttractions[1] || 'Scenic Overlook';
      
      const d1 = (1.5 * distMultiplier + (idx * 0.4) % 1.2).toFixed(1);
      const d2 = (0.5 * distMultiplier + (idx * 0.1) % 0.4).toFixed(1);
      const d3 = (2.2 * distMultiplier + (idx * 0.7) % 2.1).toFixed(1);

      const getDuration = (distStr: string, mode: string) => {
        const dVal = parseFloat(distStr);
        if (mode.toLowerCase().includes('walk')) {
          return `${Math.round(dVal * 12)} mins`;
        } else if (mode.toLowerCase().includes('bicycle')) {
          return `${Math.round(dVal * 6)} mins`;
        } else if (mode.toLowerCase().includes('metro') || mode.toLowerCase().includes('train')) {
          return `${Math.round(dVal * 2 + 5)} mins`;
        }
        return `${Math.round(dVal * 3 + 2)} mins`;
      };

      return [
        { from: hotel, to: attraction1, distance: `${d1} km`, duration: getDuration(d1, mode1), mode: mode1 },
        { from: attraction1, to: lunch, distance: `${d2} km`, duration: getDuration(d2, mode2), mode: mode2 },
        { from: lunch, to: attraction2, distance: `${d3} km`, duration: getDuration(d3, mode3), mode: mode3 }
      ];
    });
  });

  parsePlan(planText: string, defaultTime: string, defaultTitle: string) {
    if (!planText) {
      return { time: defaultTime, title: defaultTitle, desc: '' };
    }
    
    const timeRegex = /^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))\s*[:\-]?\s*(.*)$/;
    const match = planText.match(timeRegex);
    if (match) {
      const time = match[1].trim();
      const rest = match[2].trim();
      
      const titleRegex = /^([^:\-\.]+)\s*[:\-]\s*(.*)$/;
      const titleMatch = rest.match(titleRegex);
      if (titleMatch) {
        return {
          time,
          title: titleMatch[1].trim(),
          desc: titleMatch[2].trim()
        };
      }
      return {
        time,
        title: defaultTitle,
        desc: rest
      };
    }
    
    return {
      time: defaultTime,
      title: defaultTitle,
      desc: planText
    };
  }

  getBreakfastNode(dayIdx: number) {
    const dest = (this.trip()?.destination || '').toLowerCase();
    let time = '08:00 AM';
    let title = 'Breakfast at Stay';
    let desc = 'Prepare for the day. Head out after breakfast.';
    
    if (dest.includes('goa') || dest.includes('andaman')) {
      time = '08:00 AM';
      title = 'Local Breakfast & Scooter Prep';
      desc = 'Enjoy a fresh breakfast at your stay or beachside cafe. Rent/check your scooter for the day.';
    } else if (dest.includes('ladakh')) {
      time = '07:00 AM';
      title = 'Early Altitude Breakfast';
      desc = 'Have a heavy breakfast to keep energy high. Keep drinking water/ORSL for altitude acclimatization. Check SUV/bike fuel.';
    } else if (dest.includes('manali')) {
      time = '08:00 AM';
      title = 'Himalayan Morning Tea & Breakfast';
      desc = 'Enjoy hot tea and Siddu or Paranthas. Put on layers and snow boots before heading out.';
    } else if (dest.includes('jaipur')) {
      time = '08:00 AM';
      title = 'Chai & Rajasthani Breakfast';
      desc = 'Have delicious Pyaaz Kachori and masala tea before stepping out into the pink city.';
    } else if (dest.includes('mumbai') || dest.includes('delhi')) {
      time = '08:00 AM';
      title = 'Breakfast at Stay';
      desc = 'Enjoy breakfast at your hotel. Check metro cards or local train schedules.';
    }
    
    if (dayIdx % 2 === 1) {
      time = time === '08:00 AM' ? '07:45 AM' : '07:30 AM';
    }
    
    return { time, title, desc };
  }

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

    const colors = ['#F97316', '#FB923C', '#EA580C', '#FFEDD5', '#FED7AA'];
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
