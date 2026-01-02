import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SaveEntryComponent } from './save-entry.component';
import { WastewiseApiService } from '../../services/wastewise-api/wastewise-api.service';
import { HttpTestingController } from '@angular/common/http/testing';
import { BASE_API_URL, SAVE_ENTRY_ROUTE } from '../../constants';

describe('SaveEntryComponent', () => {
  let component: SaveEntryComponent;
  let fixture: ComponentFixture<SaveEntryComponent>;
  let apiService: WastewiseApiService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SaveEntryComponent,
        FormsModule,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SaveEntryComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(WastewiseApiService);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty entryText', () => {
    expect(component.entryText).toBe('');
  });

  describe('onSubmit', () => {
    it('should call saveEntry API with trimmed text and clear entryText on success', () => {
      const testText = '  Test entry text  ';
      const trimmedText = testText.trim();
      component.entryText = testText;
      const mockResponse = { message: 'Entry saved successfully' };

      component.onSubmit();

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(trimmedText);
      req.flush(mockResponse);

      expect(component.entryText).toBe('');
    });

    it('should call saveEntry API with normal text and clear entryText on success', () => {
      const testText = 'Normal entry text';
      component.entryText = testText;
      const mockResponse = { message: 'Entry saved successfully' };

      component.onSubmit();

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe(testText);
      req.flush(mockResponse);

      expect(component.entryText).toBe('');
    });

    it('should trim whitespace from entry text before sending', () => {
      const testText = '\n\n  Multiple spaces and newlines  \n\n';
      const trimmedText = testText.trim();
      component.entryText = testText;
      const mockResponse = { message: 'Entry saved successfully' };

      component.onSubmit();

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.body).toBe(trimmedText);
      req.flush(mockResponse);

      expect(component.entryText).toBe('');
    });

    it('should call API with empty string when entryText is empty (validation does not prevent API call)', () => {
      component.entryText = '';
      const mockError = {
        status: 400,
        statusText: 'Bad Request',
        error: { detail: 'Input text cannot be empty or whitespace only' }
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.onSubmit();

      // API is still called even with empty string (validation doesn't return early)
      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe('');
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });

      // Entry text should remain empty (not cleared on error)
      expect(component.entryText).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save entry', expect.objectContaining({
        status: 400
      }));

      consoleErrorSpy.mockRestore();
    });

    it('should call API with empty string when entryText is only whitespace', () => {
      component.entryText = '   \n\n  \t  ';
      const mockError = {
        status: 400,
        statusText: 'Bad Request',
        error: { detail: 'Input text cannot be empty or whitespace only' }
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.onSubmit();

      // API is called with trimmed (empty) string
      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBe('');
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });

      // Entry text should remain unchanged (not cleared on error)
      expect(component.entryText).toBe('   \n\n  \t  ');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save entry', expect.objectContaining({
        status: 400
      }));

      consoleErrorSpy.mockRestore();
    });

    it('should handle API error and log error without clearing entryText', () => {
      const testText = 'Test entry that will fail';
      component.entryText = testText;
      const mockError = {
        status: 400,
        statusText: 'Bad Request',
        error: { detail: 'Input text cannot be empty or whitespace only' }
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.onSubmit();

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });

      // Entry text should not be cleared on error
      expect(component.entryText).toBe(testText);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save entry', expect.objectContaining({
        status: 400,
        error: mockError.error
      }));

      consoleErrorSpy.mockRestore();
    });

    it('should handle network errors and log error without clearing entryText', () => {
      const testText = 'Test entry with network error';
      component.entryText = testText;
      const mockError = { status: 0, statusText: 'Unknown Error' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.onSubmit();

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      req.error(new ProgressEvent('error'), mockError);

      // Entry text should not be cleared on network error
      expect(component.entryText).toBe(testText);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save entry', expect.any(Object));

      consoleErrorSpy.mockRestore();
    });

    it('should handle 500 server errors and log error without clearing entryText', () => {
      const testText = 'Test entry with server error';
      component.entryText = testText;
      const mockError = {
        status: 500,
        statusText: 'Internal Server Error',
        error: { detail: 'Error saving entry: Database connection failed' }
      };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      component.onSubmit();

      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req.request.method).toBe('POST');
      req.flush(mockError.error, { status: mockError.status, statusText: mockError.statusText });

      // Entry text should not be cleared on server error
      expect(component.entryText).toBe(testText);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save entry', expect.objectContaining({
        status: 500
      }));

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple consecutive submissions', () => {
      const firstText = 'First entry';
      const secondText = 'Second entry';
      
      // First submission
      component.entryText = firstText;
      component.onSubmit();
      
      const req1 = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      req1.flush({ message: 'Entry saved successfully' });
      
      expect(component.entryText).toBe('');
      
      // Second submission
      component.entryText = secondText;
      component.onSubmit();
      
      const req2 = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      expect(req2.request.body).toBe(secondText);
      req2.flush({ message: 'Entry saved successfully' });
      
      expect(component.entryText).toBe('');
    });
  });

  describe('Component Template Integration', () => {
    it('should have textarea element with ngModel binding', () => {
      const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      expect(textarea.id).toBe('entry-text');
      expect(textarea.name).toBe('entry-text');
      // Verify initial empty state
      expect(textarea.value).toBe('');
      expect(component.entryText).toBe('');
    });

    it('should update entryText when user types in textarea', () => {
      const textarea = fixture.nativeElement.querySelector('textarea');
      const testText = 'User typed text';

      textarea.value = testText;
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.entryText).toBe(testText);
    });

    it('should call onSubmit when submit button is clicked', () => {
      const testText = 'Button click test';
      component.entryText = testText;
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      const onSubmitSpy = jest.spyOn(component, 'onSubmit');

      submitButton.click();
      fixture.detectChanges();

      expect(onSubmitSpy).toHaveBeenCalled();

      // Handle the HTTP request that was triggered
      const req = httpMock.expectOne(`${BASE_API_URL}${SAVE_ENTRY_ROUTE}`);
      req.flush({ message: 'Entry saved successfully' });
    });

    it('should display placeholder text in textarea', () => {
      const textarea = fixture.nativeElement.querySelector('textarea');
      expect(textarea.placeholder).toBe('Enter your entry here...');
    });

    it('should have correct form structure', () => {
      const form = fixture.nativeElement.querySelector('form.entry-form');
      expect(form).toBeTruthy();

      const textarea = form.querySelector('textarea');
      expect(textarea).toBeTruthy();
      expect(textarea.id).toBe('entry-text');

      const submitButton = form.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
      expect(submitButton.textContent.trim()).toBe('Submit');
    });
  });
});

