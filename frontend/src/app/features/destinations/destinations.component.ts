import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { DestinationService } from '../../core/services/destination.service';
import { NotificationService } from '../../core/services/notification.service';
import { Destination } from '../../models/interfaces';
import { getDestinationImageUrl, getNextDestinationImageUrl } from '../../shared/constants/destination-images';

@Component({
  selector: 'app-destinations',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './destinations.component.html',
  styleUrls: ['./destinations.component.scss']
})
export class DestinationsComponent implements OnInit {
  destService = inject(DestinationService);
  notification = inject(NotificationService);
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);

  // State Signals
  destinations = signal<Destination[]>([]);
  favoriteDestinations = signal<any[]>([]);
  isLoading = signal(true);
  selectedCategory = signal<string>('All');
  sortBy = signal<string>('name');
  searchQuery = signal<string>('');

  // Categories list matching backend seeding
  categories = [
    'All',
    'Metro',
    'Hill Station',
    'Heritage',
    'Beach',
    'Wildlife',
    'Pilgrimage',
    'Adventure',
    'Northeast',
    'Weekend'
  ];

  // Friendly display names mapping for categories
  categoryDisplayMap: { [key: string]: string } = {
    'All': '✨ All',
    'Metro': '🌆 Metro Cities',
    'Hill Station': '🏔️ Hill Stations',
    'Heritage': '🏰 Heritage & Forts',
    'Beach': '🏖️ Beaches',
    'Wildlife': '🐅 Wildlife Safaris',
    'Pilgrimage': '🙏 Pilgrimage Stays',
    'Adventure': '🪂 Adventure Hubs',
    'Northeast': '🍃 Northeast Gems',
    'Weekend': '🚗 Weekend Trips'
  };

  isSearchFocused = signal(false);
  popularSearches = ['Munnar', 'Jaipur', 'Goa', 'Manali', 'Kashmir', 'Kerala'];

  searchForm: FormGroup = this.fb.group({
    search: ['']
  });

  // Calculate autocomplete suggestions dynamically
  autocompleteSuggestions = computed(() => {
    const val = this.searchQuery().trim().toLowerCase();
    if (!val) return [];
    return this.destinations().filter(d => 
      d.name.toLowerCase().includes(val) || 
      d.state?.toLowerCase().includes(val)
    ).slice(0, 5); // limit to top 5 suggestions
  });

  selectSuggestion(sug: Destination): void {
    this.searchForm.patchValue({ search: sug.name });
    this.isSearchFocused.set(false);
  }

  clearSearch(): void {
    this.searchForm.patchValue({ search: '' });
    this.selectedCategory.set('All');
    this.sortBy.set('name');
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge'
    });
  }

  setSearchQuery(query: string): void {
    this.searchForm.patchValue({ search: query });
  }

  onSearchBlur(): void {
    setTimeout(() => this.isSearchFocused.set(false), 200);
  }

  // Filtered and sorted destinations
  filteredDestinations = computed(() => {
    let result = this.destinations();
    const searchVal = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();
    const sort = this.sortBy();

    // 1. Filter by Search Query
    if (searchVal) {
      result = result.filter(d => {
        const nameMatch = d.name?.toLowerCase().includes(searchVal);
        const stateMatch = d.state?.toLowerCase().includes(searchVal);
        const cityMatch = d.city?.toLowerCase().includes(searchVal);
        const countryMatch = d.country?.toLowerCase().includes(searchVal);
        const categoryMatch = d.category?.toLowerCase().includes(searchVal);
        const descriptionMatch = d.description?.toLowerCase().includes(searchVal);
        
        const attractionsMatch = d.attractions && Array.isArray(d.attractions) && d.attractions.some(attr => attr.toLowerCase().includes(searchVal));
        const hiddenGemsMatch = d.hiddenGems && Array.isArray(d.hiddenGems) && d.hiddenGems.some(gem => gem.toLowerCase().includes(searchVal));
        const adventureMatch = d.adventureActivities && Array.isArray(d.adventureActivities) && d.adventureActivities.some(act => act.toLowerCase().includes(searchVal));
        const localFoodsMatch = d.localFoods && Array.isArray(d.localFoods) && d.localFoods.some(food => food.toLowerCase().includes(searchVal));
        
        const tagsMatch = (d as any).tags && Array.isArray((d as any).tags) && (d as any).tags.some((tag: string) => tag.toLowerCase().includes(searchVal));

        return nameMatch || stateMatch || cityMatch || countryMatch || categoryMatch || descriptionMatch || attractionsMatch || hiddenGemsMatch || adventureMatch || localFoodsMatch || tagsMatch;
      });
    }

    // 2. Filter by Category
    if (cat !== 'All') {
      result = result.filter(d => d.category?.toLowerCase() === cat.toLowerCase());
    }

    // 3. Sort Results
    result = [...result]; // Shallow copy for sorting
    if (sort === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'rating') {
      result.sort((a, b) => b.averageRating - a.averageRating);
    } else if (sort === 'popularity') {
      result.sort((a, b) => b.totalReviews - a.totalReviews);
    }

    return result;
  });

  ngOnInit(): void {
    this.loadDestinations();
    this.loadFavoriteDestinations();

    // Listen to changes in the search input and update our searchQuery signal
    this.searchForm.get('search')?.valueChanges.subscribe((val) => {
      this.searchQuery.set(val || '');
    });

    // Check for query parameters on init
    this.route.queryParams.subscribe((params) => {
      const searchParam = params['search'];
      if (searchParam) {
        this.searchForm.patchValue({ search: searchParam });
      }
    });
  }

  loadDestinations(): void {
    this.isLoading.set(true);
    this.destService.getDestinations().subscribe({
      next: (res) => {
        const mapped = (res.data.destinations || []).map((d: any) => ({
          ...d,
          imageUrl: getDestinationImageUrl(d.name)
        }));
        this.destinations.set(mapped);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.notification.error('Failed to load destinations.');
      }
    });
  }

  loadFavoriteDestinations(): void {
    this.destService.getFavoriteDestinations().subscribe({
      next: (res) => {
        const mapped = (res.data.favorites || []).map((f: any) => {
          if (f.destination) {
            f.destination.imageUrl = getDestinationImageUrl(f.destination.name);
          }
          return f;
        });
        this.favoriteDestinations.set(mapped);
      },
      error: () => {}
    });
  }

  toggleFavorite(destId: string, event: Event): void {
    event.stopPropagation();
    this.destService.toggleFavoriteDestination(destId).subscribe({
      next: (res) => {
        this.notification.success(res.message);
        this.loadFavoriteDestinations();
      },
      error: () => this.notification.error('Failed to update bookmark.')
    });
  }

  isFavorited(destId: string): boolean {
    return this.favoriteDestinations().some(f => f.destination?._id === destId);
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  // Handle image errors gracefully
  onImgError(event: any, name: string): void {
    const currentUrl = event.target.src;
    const nextUrl = getNextDestinationImageUrl(currentUrl, name);
    if (event.target.src !== nextUrl) {
      event.target.src = nextUrl;
    }
  }
}
