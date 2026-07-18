import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Destination, Review } from '../../models/interfaces';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DestinationService {
  private destUrl = `${environment.apiUrl}/destinations`;
  private reviewsUrl = `${environment.apiUrl}/reviews`;
  private favoritesUrl = `${environment.apiUrl}/favorites`;

  constructor(private http: HttpClient) {}

  // Toggle favorite on destination
  toggleFavoriteDestination(destId: string): Observable<any> {
    return this.http.post<any>(`${this.favoritesUrl}/toggle-destination/${destId}`, {});
  }

  // Get user favorite destinations
  getFavoriteDestinations(): Observable<any> {
    return this.http.get<any>(`${this.favoritesUrl}/destinations`);
  }

  // List all destinations (optional search)
  getDestinations(search?: string): Observable<any> {
    const url = search ? `${this.destUrl}?search=${encodeURIComponent(search)}` : this.destUrl;
    return this.http.get<any>(url);
  }

  // Get destination details
  getDestination(id: string): Observable<any> {
    return this.http.get<any>(`${this.destUrl}/${id}`);
  }



  // Add review to destination
  addReview(destinationId: string, rating: number, comment: string): Observable<any> {
    return this.http.post<any>(this.reviewsUrl, { destinationId, rating, comment });
  }

  // Get reviews of destination
  getReviews(destinationId: string): Observable<any> {
    return this.http.get<any>(`${this.reviewsUrl}/destination/${destinationId}`);
  }

  // Delete review
  deleteReview(id: string): Observable<any> {
    return this.http.delete<any>(`${this.reviewsUrl}/${id}`);
  }
}
