import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, Itinerary, Favorite, TripDetailResponse, StatsResponse } from '../../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TripService {
  private tripsUrl = `${environment.apiUrl}/trips`;
  private favoritesUrl = `${environment.apiUrl}/favorites`;

  constructor(private http: HttpClient) {}

  // Create Trip & AI Itinerary
  createTrip(tripData: any): Observable<TripDetailResponse> {
    return this.http.post<TripDetailResponse>(this.tripsUrl, tripData);
  }

  // Get User Trips (Searched, Filtered, Paginated)
  getTrips(filters: {
    search?: string;
    budget?: string;
    tripType?: string;
    duration?: string;
    country?: string;
    page?: number;
    limit?: number;
  }): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach((key) => {
      const val = (filters as any)[key];
      if (val !== undefined && val !== null && val !== '') {
        params = params.set(key, val.toString());
      }
    });
    return this.http.get<any>(this.tripsUrl, { params });
  }

  // Get single trip details with itinerary
  getTrip(id: string): Observable<TripDetailResponse> {
    return this.http.get<TripDetailResponse>(`${this.tripsUrl}/${id}`);
  }

  // Update Trip configuration
  updateTrip(id: string, tripData: any): Observable<any> {
    return this.http.put<any>(`${this.tripsUrl}/${id}`, tripData);
  }

  // Delete Trip
  deleteTrip(id: string): Observable<any> {
    return this.http.delete<any>(`${this.tripsUrl}/${id}`);
  }

  // Duplicate Trip
  duplicateTrip(id: string): Observable<any> {
    return this.http.post<any>(`${this.tripsUrl}/${id}/duplicate`, {});
  }

  // Get Weather for Trip destination
  getTripWeather(id: string): Observable<any> {
    return this.http.get<any>(`${this.tripsUrl}/${id}/weather`);
  }

  // Update individual itinerary day plan
  updateItineraryDay(tripId: string, dayNumber: number, dayPlan: any): Observable<any> {
    const itineraryId = dayPlan.itineraryId; // We will pass this in body or retrieve in component
    return this.http.put<any>(`${this.tripsUrl}/${tripId}/itinerary/days/${dayNumber}`, dayPlan);
  }

  // Update travel tips of trip itinerary
  updateItineraryTips(tripId: string, travelTips: string[]): Observable<any> {
    return this.http.put<any>(`${this.tripsUrl}/${tripId}/itinerary/tips`, { travelTips });
  }

  // Toggle favorite on trip
  toggleFavorite(tripId: string): Observable<any> {
    return this.http.post<any>(`${this.favoritesUrl}/toggle/${tripId}`, {});
  }

  // Get user favorited trips
  getFavorites(): Observable<any> {
    return this.http.get<any>(this.favoritesUrl);
  }

  // Retrieve user analytics statistics
  getStats(): Observable<StatsResponse> {
    return this.http.get<StatsResponse>(`${this.tripsUrl}/stats`);
  }
}
