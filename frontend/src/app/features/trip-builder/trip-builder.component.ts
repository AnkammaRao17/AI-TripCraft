import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import { TripService } from '../../core/services/trip.service';
import { DestinationService } from '../../core/services/destination.service';
import { NotificationService } from '../../core/services/notification.service';
import { Destination } from '../../models/interfaces';

export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const inputDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today ? null : { pastDate: true };
  };
}

@Component({
  selector: 'app-trip-builder',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
  ],
  templateUrl: './trip-builder.component.html',
  styleUrls: ['./trip-builder.component.scss']
})
export class TripBuilderComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tripService = inject(TripService);
  private destService = inject(DestinationService);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  isLoading = signal(false);
  loadingMessage = signal('Sending details to Gemini AI...');
  destinations = signal<Destination[]>([]);
  sliderValue = signal<number>(2);

  budgetLabel = computed(() => {
    const labels = ['Budget', 'Moderate', 'Luxury'];
    return labels[this.sliderValue() - 1];
  });

  filteredDestinations = computed(() => {
    const input = this.firstFormGroup.get('destination')?.value || '';
    return this.destinations().filter((d) =>
      d.name.toLowerCase().includes(input.toLowerCase())
    );
  });

  // Interests list
  availableInterests = [
    { name: 'History & Culture', value: 'History', selected: false, icon: 'account_balance' },
    { name: 'Adventure & Sports', value: 'Adventure', selected: false, icon: 'explore' },
    { name: 'Nature & Wildlife', value: 'Nature', selected: false, icon: 'forest' },
    { name: 'Relaxation & Spa', value: 'Relaxation', selected: false, icon: 'spa' },
    { name: 'Food & Culinary', value: 'Food', selected: false, icon: 'restaurant' },
    { name: 'Shopping & Fashion', value: 'Shopping', selected: false, icon: 'shopping_bag' },
    { name: 'Nightlife & Bars', value: 'Nightlife', selected: false, icon: 'nightlife' },
    { name: 'Art & Museums', value: 'Art', selected: false, icon: 'museum' },
  ];

  // Steps
  firstFormGroup: FormGroup = this.fb.group({
    destination: ['', Validators.required],
    country: ['India', Validators.required],
    startDate: ['', [Validators.required, futureDateValidator()]],
    numberOfDays: [3, [Validators.required, Validators.min(1), Validators.max(30)]],
  });

  secondFormGroup: FormGroup = this.fb.group({
    budget: ['Moderate', Validators.required],
    numberOfTravelers: [1, [Validators.required, Validators.min(1)]],
    tripType: ['Solo', Validators.required],
  });

  thirdFormGroup: FormGroup = this.fb.group({
    transportPreference: ['Public Transit', Validators.required],
    hotelPreference: ['Hotel', Validators.required],
    foodPreference: ['Any', Validators.required],
  });

  ngOnInit(): void {
    // Fetch destinations list for autocomplete
    this.destService.getDestinations().subscribe({
      next: (res) => {
        this.destinations.set(res.data.destinations || []);
        
        // Load query parameters if clicked from catalog
        const paramDest = this.route.snapshot.queryParams['destination'];
        const paramCountry = this.route.snapshot.queryParams['country'];
        if (paramDest) {
          this.firstFormGroup.patchValue({ destination: paramDest });
        }
        if (paramCountry) {
          this.firstFormGroup.patchValue({ country: paramCountry });
        }
      }
    });

    // Auto-fill country field on destination input match
    this.firstFormGroup.get('destination')?.valueChanges.subscribe((val) => {
      const match = this.destinations().find(
        (d) => d.name.toLowerCase() === val?.trim().toLowerCase()
      );
      if (match) {
        this.firstFormGroup.patchValue({ country: match.country });
      }
    });
  }

  onSliderInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value);
    this.sliderValue.set(val);
    const budgetMap = ['Budget', 'Moderate', 'Luxury'];
    this.secondFormGroup.patchValue({ budget: budgetMap[val - 1] });
  }

  toggleInterest(index: number): void {
    this.availableInterests[index].selected = !this.availableInterests[index].selected;
  }

  onSubmit(): void {
    if (this.firstFormGroup.invalid || this.secondFormGroup.invalid || this.thirdFormGroup.invalid) {
      this.notification.warning('Please complete all form fields.');
      return;
    }

    const selectedInterests = this.availableInterests
      .filter((i) => i.selected)
      .map((i) => i.value);

    const tripPayload = {
      ...this.firstFormGroup.value,
      ...this.secondFormGroup.value,
      ...this.thirdFormGroup.value,
      interests: selectedInterests,
    };

    this.isLoading.set(true);
    this.loadingMessage.set('Sending parameters to Gemini AI...');
    
    // Add micro-animations / loading messages phase for superior SaaS feeling
    setTimeout(() => {
      this.loadingMessage.set('Gemini is tailoring morning, afternoon & evening plans...');
    }, 2500);

    setTimeout(() => {
      this.loadingMessage.set('Structuring local food suggestions and budget breakdowns...');
    }, 5500);

    this.tripService.createTrip(tripPayload).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notification.success('AI Itinerary generated successfully!');
        this.router.navigate(['/itinerary', res.data.trip._id]);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errMsg = err.error?.message || 'Error compiling your itinerary. Please try again.';
        this.notification.error(errMsg);
      },
    });
  }
}
