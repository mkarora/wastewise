import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WastewiseApiService } from './wastewise-api.service';
import { BASE_API_URL, SAVE_ENTRY_ROUTE, GET_INSIGHTS_ROUTE } from '../../constants';

describe('WastewiseApiService', () => {
  let service: WastewiseApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WastewiseApiService]
    });
    service = TestBed.inject(WastewiseApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('saveEntry', () => {
    it('should make a POST request to the correct URL with the text body', () => {
      const testText = 'Test entry text';
      const mockResponse = { message: 'Entry saved successfully' };

      service.saveEntry(testText).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(testText);
      req.flush(mockResponse);
    });

    it('should handle different entry texts', () => {
      const testText = 'Another test entry with different content';
      const mockResponse = { message: 'Entry saved successfully' };

      service.saveEntry(testText).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(testText);
      req.flush(mockResponse);
    });

    it('should handle empty string entry', () => {
      const testText = '';
      const mockResponse = { message: 'Entry saved successfully' };

      service.saveEntry(testText).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(testText);
      req.flush(mockResponse);
    });

    it('should handle error responses', () => {
      const testText = 'Test entry';
      const mockError = { status: 400, statusText: 'Bad Request', error: { detail: 'Input text cannot be empty' } };

      service.saveEntry(testText).subscribe({
        next: () => {
          throw new Error('should have failed with 400 error');
        },
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.detail).toBe('Input text cannot be empty');
        }
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });
    });

    it('should handle network errors', () => {
      const testText = 'Test entry';
      const mockError = { status: 0, statusText: 'Unknown Error' };

      service.saveEntry(testText).subscribe({
        next: () => {
          throw new Error('should have failed with network error');
        },
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      req.error(new ProgressEvent('error'), mockError);
    });
  });

  describe('getInsights', () => {
    it('should make a GET request to the correct URL', () => {
      const mockResponse = {
        message: 'Got ollama response',
        response: 'Your monthly insights here'
      };

      service.getInsights().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.response).toBe('Your monthly insights here');
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle response with insights content', () => {
      const mockResponse = {
        message: 'Got ollama response',
        response: 'Here are your insights:\n- You generated 5kg of waste\n- Most waste was plastic'
      };

      service.getInsights().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.response).toContain('Here are your insights');
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle response with no entries message', () => {
      const mockResponse = {
        message: 'No entries found in current month'
      };

      service.getInsights().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.message).toBe('No entries found in current month');
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error responses', () => {
      const mockError = {
        status: 500,
        statusText: 'Internal Server Error',
        error: { detail: 'Error retrieving entries: Database connection failed' }
      };

      service.getInsights().subscribe({
        next: () => {
          throw new Error('should have failed with 500 error');
        },
        error: (error) => {
          expect(error.status).toBe(500);
          expect(error.error.detail).toContain('Error retrieving entries');
        }
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });
    });

    it('should handle network errors', () => {
      const mockError = { status: 0, statusText: 'Unknown Error' };

      service.getInsights().subscribe({
        next: () => {
          throw new Error('should have failed with network error');
        },
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      expect(req.request.method).toBe('GET');
      req.error(new ProgressEvent('error'), mockError);
    });

    it('should handle 404 not found errors', () => {
      const mockError = {
        status: 404,
        statusText: 'Not Found',
        error: { detail: 'Endpoint not found' }
      };

      service.getInsights().subscribe({
        next: () => {
          throw new Error('should have failed with 404 error');
        },
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.error.detail).toBe('Endpoint not found');
        }
      });

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });
    });
  });
});
