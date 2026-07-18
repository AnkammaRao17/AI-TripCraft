import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private http = inject(HttpClient);
  private aiUrl = `${environment.apiUrl}/ai`;
  public itineraryModified$ = new Subject<void>();

  chat(message: string, tripId?: string, chatHistory?: any[]): Observable<any> {
    const payload: any = { message };
    if (tripId) payload.tripId = tripId;
    if (chatHistory) payload.chatHistory = chatHistory;
    return this.http.post<any>(`${this.aiUrl}/chat`, payload);
  }

  getInsights(): Observable<any> {
    return this.http.get<any>(`${this.aiUrl}/insights`);
  }

  getRecommendations(month?: string, budget?: string, tripType?: string): Observable<any> {
    const payload: any = {};
    if (month) payload.month = month;
    if (budget) payload.budget = budget;
    if (tripType) payload.tripType = tripType;
    return this.http.post<any>(`${this.aiUrl}/recommend`, payload);
  }

  getBudgetTips(tripId: string): Observable<any> {
    let params = new HttpParams().set('tripId', tripId);
    return this.http.get<any>(`${this.aiUrl}/budget-tips`, { params });
  }
}
