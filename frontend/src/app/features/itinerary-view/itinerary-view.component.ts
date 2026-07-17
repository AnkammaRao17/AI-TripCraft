import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { NotificationService } from '../../core/services/notification.service';
import { Trip, Itinerary } from '../../models/interfaces';

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
  private notification = inject(NotificationService);
  private router = inject(Router);

  // Signals
  trip = signal<Trip | null>(null);
  itinerary = signal<Itinerary | null>(null);
  weatherData = signal<any | null>(null);
  isLoading = signal(true);
  isWeatherLoading = signal(true);
  isFavorited = signal(false);

  // Tabs & Checklist Signals
  activeTab = signal<'schedule' | 'tips' | 'packing' | 'hotels'>('schedule');
  packingItems = signal<{ name: string; checked: boolean }[]>([]);
  customPackingItem = signal<string>('');

  // Maps coordinates and active marker category
  activeMapCategory = signal<'attractions' | 'hotels' | 'restaurants' | 'airports'>('attractions');
  mapMarkers = computed(() => {
    const t = this.trip();
    if (!t) return [];
    
    // Generate dynamic mock geolocations based on destination name for map mockup
    const lat = this.weatherData()?.coordinates?.lat || 48.8566;
    const lng = this.weatherData()?.coordinates?.lng || 2.3522;

    const items = {
      attractions: [
        { name: `${t.destination} Main Landmark`, lat: lat + 0.005, lng: lng - 0.003, details: 'Famous historical viewpoint' },
        { name: 'City Center Art Museum', lat: lat - 0.004, lng: lng + 0.006, details: 'Classic and modern exhibitions' }
      ],
      hotels: [
        { name: `${t.destination} Grand Plaza Hotel`, lat: lat - 0.002, lng: lng - 0.002, details: 'Highly rated comfort stay' },
        { name: 'Rooftop Boutique Airbnb', lat: lat + 0.006, lng: lng + 0.003, details: 'Scenic skyline stays' }
      ],
      restaurants: [
        { name: 'La Custom Kitchen', lat: lat + 0.003, lng: lng + 0.002, details: 'Traditional local cuisine' },
        { name: 'Corner Bistro & Coffee', lat: lat - 0.005, lng: lng - 0.004, details: 'Great morning roast and brunch' }
      ],
      airports: [
        { name: `${t.destination} International Airport (Terminal 1)`, lat: lat + 0.085, lng: lng - 0.065, details: 'Main entry hub' }
      ]
    };
    return items[this.activeMapCategory()];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadTripDetails(id);
    } else {
      this.router.navigate(['/dashboard']);
    }
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
    const itin = this.itinerary();
    if (!t || !itin) {
      this.notification.warning('Itinerary data not fully loaded.');
      return;
    }

    try {
      const doc = new jsPDF() as any;
      const primaryColor = [99, 102, 241]; // Indigo
      
      // Header Section
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('AI TRIPCRAPT - ITINERARY', 15, 25);

      doc.setFontSize(12);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Generated for: ${t.destination}, ${t.country}`, 15, 33);

      // Trip Specifications
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('Trip Details', 15, 52);

      const detailsData = [
        ['Start Date', new Date(t.startDate).toDateString(), 'Duration', `${t.numberOfDays} Days`],
        ['Budget Level', t.budget, 'Travelers', `${t.numberOfTravelers} Person(s)`],
        ['Trip Type', t.tripType, 'Preferences', `Hotel: ${t.hotelPreference} | Transport: ${t.transportPreference}`]
      ];

      doc.autoTable({
        startY: 56,
        body: detailsData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', width: 35 }, 2: { fontStyle: 'bold', width: 35 } }
      });

      // Budget Breakdown Table
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('Estimated Budget Summary', 15, 92);

      const budgetData = [
        ['Category', 'Cost (INR)'],
        ['Accommodations (Hotel/Resort)', `₹${t.estimatedBudgetBreakdown.hotelCost.toLocaleString('en-IN')}`],
        ['Meals & Dining', `₹${t.estimatedBudgetBreakdown.foodCost.toLocaleString('en-IN')}`],
        ['Transit & Transportation', `₹${t.estimatedBudgetBreakdown.transportCost.toLocaleString('en-IN')}`],
        ['Sightseeing & Attractions', `₹${t.estimatedBudgetBreakdown.attractionsCost.toLocaleString('en-IN')}`],
        ['Total Estimated', `₹${t.estimatedBudgetBreakdown.total.toLocaleString('en-IN')}`]
      ];

      doc.autoTable({
        startY: 96,
        head: [budgetData[0]],
        body: budgetData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9 }
      });

      // Day-by-Day schedule
      let currentY = doc.previousAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.setFont('Helvetica', 'bold');
      doc.text('Day-by-Day Travel Plans', 15, currentY);
      currentY += 6;

      itin.days.forEach((day) => {
        // Page break if near bottom
        if (currentY > 260) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(11);
        doc.setFont('Helvetica', 'bold');
        doc.setFillColor(240, 240, 240);
        doc.rect(15, currentY - 4, 180, 7, 'F');
        doc.text(`DAY ${day.dayNumber} - SCHEDULE`, 18, currentY + 1);
        currentY += 10;

        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        
        doc.setFont('Helvetica', 'bold');
        doc.text('Morning:', 18, currentY);
        doc.setFont('Helvetica', 'normal');
        doc.text(doc.splitTextToSize(day.morningPlan, 150), 38, currentY);
        currentY += Math.max(doc.splitTextToSize(day.morningPlan, 150).length * 4.5, 6);

        doc.setFont('Helvetica', 'bold');
        doc.text('Afternoon:', 18, currentY);
        doc.setFont('Helvetica', 'normal');
        doc.text(doc.splitTextToSize(day.afternoonPlan, 150), 38, currentY);
        currentY += Math.max(doc.splitTextToSize(day.afternoonPlan, 150).length * 4.5, 6);

        doc.setFont('Helvetica', 'bold');
        doc.text('Evening:', 18, currentY);
        doc.setFont('Helvetica', 'normal');
        doc.text(doc.splitTextToSize(day.eveningPlan, 150), 38, currentY);
        currentY += Math.max(doc.splitTextToSize(day.eveningPlan, 150).length * 4.5, 8);

        doc.setFont('Helvetica', 'bold');
        doc.text('Attractions:', 18, currentY);
        doc.setFont('Helvetica', 'normal');
        doc.text(day.recommendedAttractions.join(', '), 38, currentY);
        currentY += 5;

        doc.setFont('Helvetica', 'bold');
        doc.text('Restaurants:', 18, currentY);
        doc.setFont('Helvetica', 'normal');
        doc.text(day.restaurants.join(', '), 38, currentY);
        currentY += 8;
      });

      // Save PDF
      doc.save(`Itinerary_${t.destination}_${t.numberOfDays}Days.pdf`);
      this.notification.success('Itinerary PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      this.notification.error('Error compiling PDF file.');
    }
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
}
