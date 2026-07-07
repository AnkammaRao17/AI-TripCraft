import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private adminUrl = 'http://localhost:5000/api/admin';

  constructor(private http: HttpClient) {}

  // List all users in system (Admin only)
  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.adminUrl}/users`);
  }

  // Delete a user (Admin only)
  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.adminUrl}/users/${id}`);
  }

  // List all trips in system (Admin only)
  getAllTrips(): Observable<any> {
    return this.http.get<any>(`${this.adminUrl}/trips`);
  }
}
