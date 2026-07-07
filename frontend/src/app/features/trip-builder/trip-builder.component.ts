import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TripService } from '../../core/services/trip.service';
import { NotificationService } from '../../core/services/notification.service';

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
  ],
  templateUrl: './trip-builder.component.html',
  styleUrls: ['./trip-builder.component.scss']
})
export class TripBuilderComponent {
  private fb = inject(FormBuilder);
  private tripService = inject(TripService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Signals
  isLoading = signal(false);
  loadingMessage = signal('Sending details to Gemini AI...');

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
    country: ['', Validators.required],
    startDate: ['', Validators.required],
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
