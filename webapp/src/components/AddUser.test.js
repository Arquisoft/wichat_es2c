import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser';

const mockAxios = new MockAdapter(axios);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock setTimeout
jest.useFakeTimers();

describe('AddUser component', () => {
  beforeEach(() => {
    mockAxios.reset();
    localStorageMock.clear();
    window.location.href = '';
    jest.clearAllMocks();
  });

  it('should register user successfully', async () => {
    render(<AddUser />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const registerButton = screen.getByRole('button', { name: /Register/i });

    // Mock the axios.post request to simulate a successful response
    mockAxios.onPost('http://localhost:8000/adduser').reply(200);

    // Simulate user input
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Trigger the register button click
    fireEvent.click(registerButton);

    // Wait for the success alert to appear
    await waitFor(() => {
      expect(screen.getByText(/Successfully registered/i)).toBeInTheDocument();
    });

    // Advance timers to trigger the redirect
    jest.advanceTimersByTime(1500);

    // Check for redirection
    expect(window.location.href).toBe('/login');
  });


  it('should redirect if already logged in', () => {
    // Set token to simulate logged-in state
    localStorageMock.getItem.mockReturnValue('fake-token');

    render(<AddUser />);

    expect(window.location.href).toBe('/home');
  });
});