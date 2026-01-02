import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_API_URL, SAVE_ENTRY_ROUTE } from '../../constants';

@Injectable({
  providedIn: 'root'
})
export class WastewiseApiService {

  constructor(private http: HttpClient) { }

  saveEntry(text: string): Observable<any> {
    const url = `${BASE_API_URL}${SAVE_ENTRY_ROUTE}`;
    return this.http.post(url, text);
  }
}
