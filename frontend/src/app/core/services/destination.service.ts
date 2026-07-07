import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Destination, Review } from '../../models/interfaces';

@Injectable({
  providedIn: 'root',
})
export class DestinationService {
  private destUrl = 'http://localhost:5000/api/destinations';
  private reviewsUrl = 'http://localhost:5000/api/reviews';

  constructor(private http: HttpClient) {}

  // List all destinations (optional search)
  getDestinations(search?: string): Observable<any> {
    const url = search ? `${this.destUrl}?search=${encodeURIComponent(search)}` : this.destUrl;
    return this.http.get<any>(url);
  }

  // Get destination details
  getDestination(id: string): Observable<any> {
    return this.http.get<any>(`${this.destUrl}/${id}`);
  }

  // Create Destination (Admin only)
  createDestination(data: any): Observable<any> {
    return this.http.post<any>(this.destUrl, data);
  }

  // Update Destination (Admin only)
  updateDestination(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.destUrl}/${id}`, data);
  }

  // Delete Destination (Admin only)
  deleteDestination(id: string): Observable<any> {
    return this.http.delete<any>(`${this.destUrl}/${id}`);
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
