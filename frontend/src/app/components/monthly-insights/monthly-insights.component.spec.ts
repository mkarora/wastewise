import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MonthlyInsightsComponent } from './monthly-insights.component';
import { WastewiseApiService } from '../../services/wastewise-api/wastewise-api.service';
import { BASE_API_URL, GET_INSIGHTS_ROUTE } from '../../constants';

describe('MonthlyInsightsComponent', () => {
  let component: MonthlyInsightsComponent;
  let fixture: ComponentFixture<MonthlyInsightsComponent>;
  let apiService: WastewiseApiService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MonthlyInsightsComponent,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MonthlyInsightsComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(WastewiseApiService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Prevent automatic ngOnInit from triggering HTTP requests in tests that don't need it
    // Tests that need ngOnInit will call it explicitly or use fixture.detectChanges() intentionally
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    // Don't call fixture.detectChanges() to avoid triggering ngOnInit
    expect(component).toBeTruthy();
  });

  it('should initialize with loading state', () => {
    // Don't call fixture.detectChanges() to avoid triggering ngOnInit
    expect(component.isLoading).toBe(true);
    expect(component.insights).toBeNull();
    expect(component.error).toBeNull();
  });

  describe('ngOnInit', () => {
    it('should call loadInsights on initialization', () => {
      const loadInsightsSpy = jest.spyOn(component, 'loadInsights');
      
      component.ngOnInit();
      
      expect(loadInsightsSpy).toHaveBeenCalled();
      
      // Handle the HTTP request that was triggered
      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req.flush({ response: 'Test' });
    });

    it('should make API call when component initializes', () => {
      const mockResponse = {
        message: 'Got ollama response',
        response: 'Your monthly insights here'
      };

      component.ngOnInit();

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(component.isLoading).toBe(false);
      expect(component.insights).toBe('Your monthly insights here');
    });
  });

  describe('loadInsights', () => {
    beforeEach(() => {
      // Reset component state before each test
      component.isLoading = false;
      component.insights = 'previous insights';
      component.error = 'previous error';
    });

    it('should set isLoading to true and clear error when called', () => {
      component.loadInsights();

      expect(component.isLoading).toBe(true);
      expect(component.error).toBeNull();

      // Clean up the request
      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req.flush({ message: 'Test' });
    });

    it('should handle success response with response field', () => {
      const mockResponse = {
        message: 'Got ollama response',
        response: 'Here are your insights:\n- You generated 5kg of waste\n- Most waste was plastic'
      };

      component.loadInsights();

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(component.isLoading).toBe(false);
      expect(component.insights).toBe(mockResponse.response);
      expect(component.error).toBeNull();
    });

    it('should handle success response with only message field', () => {
      const mockResponse = {
        message: 'No entries found in current month'
      };

      component.loadInsights();

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req.flush(mockResponse);

      expect(component.isLoading).toBe(false);
      expect(component.insights).toBe('No entries found in current month');
      expect(component.error).toBeNull();
    });

    it('should handle success response with neither response nor message field', () => {
      const mockResponse = {
        someOtherField: 'unexpected structure'
      };

      component.loadInsights();

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req.flush(mockResponse);

      expect(component.isLoading).toBe(false);
      expect(component.insights).toBe(JSON.stringify(mockResponse));
      expect(component.error).toBeNull();
    });

    it('should handle error response with detail field', () => {
      const mockError = {
        status: 500,
        statusText: 'Internal Server Error',
        error: { detail: 'Error retrieving entries: Database connection failed' }
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.loadInsights();

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });

      expect(component.isLoading).toBe(false);
      expect(component.error).toBe('Error retrieving entries: Database connection failed');
      expect(component.insights).toBe('previous insights');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading insights:', expect.objectContaining({
        status: 500,
        error: mockError.error
      }));

      consoleErrorSpy.mockRestore();
    });

    it('should handle error response with message field when detail is missing', () => {
      const mockError = {
        status: 404,
        statusText: 'Not Found',
        error: { message: 'Endpoint not found' }
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.loadInsights();

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });

      expect(component.isLoading).toBe(false);
      // When detail is missing, it falls back to err.message which is the HTTP error message
      expect(component.error).toContain('404 Not Found');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle error response with default message when neither detail nor message exists', () => {
      const mockError = {
        status: 500,
        statusText: 'Internal Server Error',
        error: {}
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.loadInsights();

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });

      expect(component.isLoading).toBe(false);
      // When neither detail nor message exists, it falls back to err.message (HTTP error message)
      expect(component.error).toContain('500 Internal Server Error');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors with default message', () => {
      const mockError = { status: 0, statusText: 'Unknown Error' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.loadInsights();

      const req = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req.error(new ProgressEvent('error'), mockError);

      expect(component.isLoading).toBe(false);
      // When network error occurs, err.message exists, so it uses that instead of default
      expect(component.error).toContain('Unknown Error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading insights:', expect.any(Object));

      consoleErrorSpy.mockRestore();
    });

    it('should handle retry after error', () => {
      // First call fails
      component.loadInsights();
      const req1 = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req1.flush({ detail: 'First error' }, { status: 500, statusText: 'Internal Server Error' });

      expect(component.error).toBe('First error');
      expect(component.isLoading).toBe(false);

      // Retry succeeds
      component.loadInsights();
      const req2 = httpMock.expectOne(`${BASE_API_URL}${GET_INSIGHTS_ROUTE}`);
      req2.flush({ response: 'Retry successful' });

      expect(component.error).toBeNull();
      expect(component.insights).toBe('Retry successful');
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Component Template Integration', () => {
    beforeEach(() => {
      // Prevent ngOnInit from triggering HTTP requests in template tests
      jest.spyOn(component, 'ngOnInit').mockImplementation();
      // Also mock loadInsights to prevent HTTP requests unless explicitly tested
      jest.spyOn(component, 'loadInsights').mockImplementation(() => {
        // Mock implementation that doesn't make HTTP calls
      });
    });

    it('should display loading spinner when isLoading is true', () => {
      component.isLoading = true;
      component.error = null;
      component.insights = null;
      fixture.detectChanges();

      const loadingContainer = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingContainer).toBeTruthy();
      
      const spinner = fixture.nativeElement.querySelector('.spinner');
      expect(spinner).toBeTruthy();
      
      const loadingText = fixture.nativeElement.querySelector('.loading-text');
      expect(loadingText).toBeTruthy();
      expect(loadingText.textContent.trim()).toBe('Loading your insights...');
    });

    it('should display error message and retry button when error exists', () => {
      component.isLoading = false;
      component.error = 'Test error message';
      component.insights = null;
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeTruthy();
      
      const errorText = fixture.nativeElement.querySelector('.error-text');
      expect(errorText).toBeTruthy();
      expect(errorText.textContent.trim()).toBe('Test error message');
      
      const retryButton = fixture.nativeElement.querySelector('.retry-button');
      expect(retryButton).toBeTruthy();
      expect(retryButton.textContent.trim()).toBe('Retry');
    });

    it('should call loadInsights when retry button is clicked', () => {
      // loadInsights is already mocked in beforeEach, so we just verify it's called
      const loadInsightsSpy = jest.spyOn(component, 'loadInsights');
      
      component.isLoading = false;
      component.error = 'Test error';
      component.insights = null;
      fixture.detectChanges();

      const retryButton = fixture.nativeElement.querySelector('.retry-button') as HTMLButtonElement;
      expect(retryButton).toBeTruthy();

      retryButton.click();
      fixture.detectChanges();

      expect(loadInsightsSpy).toHaveBeenCalled();
    });

    it('should display insights content when insights exist', () => {
      component.isLoading = false;
      component.error = null;
      component.insights = 'Here are your insights:\n- Point 1\n- Point 2';
      fixture.detectChanges();

      const insightsContent = fixture.nativeElement.querySelector('.insights-content');
      expect(insightsContent).toBeTruthy();
      
      const insightsText = fixture.nativeElement.querySelector('.insights-text');
      expect(insightsText).toBeTruthy();
      expect(insightsText.textContent.trim()).toBe('Here are your insights:\n- Point 1\n- Point 2');
    });

    it('should display no insights message when no insights are available', () => {
      component.isLoading = false;
      component.error = null;
      component.insights = null;
      fixture.detectChanges();

      const noInsights = fixture.nativeElement.querySelector('.no-insights');
      expect(noInsights).toBeTruthy();
      
      const noInsightsText = fixture.nativeElement.querySelector('.no-insights .insights-text');
      expect(noInsightsText).toBeTruthy();
      expect(noInsightsText.textContent.trim()).toBe('No insights available at this time.');
    });

    it('should display title correctly', () => {
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('h1');
      expect(title).toBeTruthy();
      expect(title.textContent.trim()).toBe('Monthly Insights');
    });

    it('should not show loading spinner when not loading', () => {
      component.isLoading = false;
      component.error = null;
      component.insights = 'Some insights';
      fixture.detectChanges();

      const loadingContainer = fixture.nativeElement.querySelector('.loading-container');
      expect(loadingContainer).toBeFalsy();
    });

    it('should not show error when there is no error', () => {
      component.isLoading = false;
      component.error = null;
      component.insights = 'Some insights';
      fixture.detectChanges();

      const errorContainer = fixture.nativeElement.querySelector('.error-container');
      expect(errorContainer).toBeFalsy();
    });

    it('should show correct state transitions', () => {
      // Initial loading state
      component.isLoading = true;
      component.error = null;
      component.insights = null;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.loading-container')).toBeTruthy();

      // Success state
      component.isLoading = false;
      component.insights = 'Success insights';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.loading-container')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.insights-content')).toBeTruthy();

      // Error state
      component.isLoading = false;
      component.insights = null;
      component.error = 'Error occurred';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.insights-content')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('.error-container')).toBeTruthy();
    });
  });
});

