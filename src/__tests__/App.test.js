import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
global.fetch = jest.fn();

// Wrapper component to provide Router context
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('App Component', () => {
  beforeEach(() => {
    fetch.mockClear();
    localStorage.clear();
    // Mock console.error to suppress act warnings in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

    describe('Authentication Flow', () => {
    test('should render login form when not authenticated', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await act(async () => {
        render(<App />, { wrapper: RouterWrapper });
      });

      expect(screen.getByText('Car Parts Management System')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    test('should handle successful login', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          token: 'fake-jwt-token', 
          role: 'admin',
          username: 'admin'
        }),
      });

      await act(async () => {
        render(<App />, { wrapper: RouterWrapper });
      });

      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'admin' } });
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));
      });

      await waitFor(() => {
        expect(screen.getByText('Welcome, admin!')).toBeInTheDocument();
      });
    });

    test('should handle login error', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      fetch.mockRejectedValueOnce(new Error('Invalid credentials'));

      await act(async () => {
        render(<App />, { wrapper: RouterWrapper });
      });

      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'invalid' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'invalid' } });
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Login' }));
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    test('should handle user registration', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User registered successfully' }),
      });

      await act(async () => {
        render(<App />, { wrapper: RouterWrapper });
      });

      fireEvent.click(screen.getByText('Register'));
      
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password' } });
      
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Register' }));
      });

      await waitFor(() => {
        expect(screen.getByText(/user registered successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'fake-jwt-token');
      fetch.mockResolvedValue({
        ok: true,
        json: async () => []
      });
    });

    it('should display navigation links when authenticated', async () => {
      await act(async () => {
        render(<App />, { wrapper: RouterWrapper });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Stock Reports')).toBeInTheDocument();
        expect(screen.getByText('Parts Management')).toBeInTheDocument();
        expect(screen.getByText('Sales')).toBeInTheDocument();
      });
    });

    it('should show admin link for admin users', async () => {
      localStorage.setItem('userRole', 'admin');
      
      await act(async () => {
        render(<App />, { wrapper: RouterWrapper });
      });
      
      await waitFor(() => {
        expect(screen.getByText('Stock Reports')).toBeInTheDocument();
      });
    });
  });

  describe('Parts Management Integration', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'fake-jwt-token');
    });

    it('should fetch and display parts', async () => {
      const mockParts = [
        {
          id: 1,
          name: 'Test Part',
          manufacturer: 'Test Manufacturer',
          stock_status: 'available',
          recommended_price: '100.00'
        }
      ];

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockParts
      });

      await act(async () => {
        render(<App />, { wrapper: RouterWrapper });
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('http://localhost:3000/parts', {
          headers: {
            Authorization: 'Bearer fake-jwt-token'
          }
        });
      });
    });

    it('should handle parts fetch error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<App />, { wrapper: RouterWrapper });
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch car parts')).toBeInTheDocument();
      });
    });
  });
});
