import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser';

const mockAxios = new MockAdapter(axios);

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

const mockLocation = {
  href: '',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

jest.useFakeTimers();

describe('AddUser component', () => {
  const fillAndSubmitForm = (username, password) => {
    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const registerButton = screen.getByRole('button', { name: /Register/i });

    if (username) fireEvent.change(usernameInput, { target: { value: username } });
    if (password) fireEvent.change(passwordInput, { target: { value: password } });
    fireEvent.click(registerButton);

    return { usernameInput, passwordInput, registerButton };
  };

  const checkNavigation = (element, key = null) => {
    if (key) {
      fireEvent.keyDown(element, { key });
    } else {
      fireEvent.click(element);
    }
  };

  beforeEach(() => {
    mockAxios.reset();
    localStorageMock.clear();
    window.location.href = '';
    jest.clearAllMocks();
  });

  it('should render signup form correctly', () => {
    render(<AddUser />);
    expect(screen.getByRole('heading', { name: 'Register' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument();
    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
  });

  it('should register user successfully', async () => {
    render(<AddUser />);
    mockAxios.onPost('http://localhost:8000/adduser').reply(200);

    fillAndSubmitForm('testUser', 'testPassword');

    await waitFor(() => {
      expect(screen.getByText(/Successfully registered/i)).toBeInTheDocument();
    });

    jest.advanceTimersByTime(1500);
    expect(window.location.href).toBe('/login');
  });

  it('should show error for password too short', async () => {
    render(<AddUser />);
    fillAndSubmitForm('testUser', 'pw');

    await waitFor(() => {
      const errorElements = screen.getAllByText('Password must be at least 3 characters long');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('should show error for username too short', async () => {
    render(<AddUser />);
    fillAndSubmitForm('tu', 'password');

    await waitFor(() => {
      const errorElements = screen.getAllByText('Username must be at least 3 characters long');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('should show error when fields are empty', async () => {
    render(<AddUser />);
    fillAndSubmitForm(null, null);

    expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
  });

  it('should handle server error during registration', async () => {
    render(<AddUser />);
    mockAxios.onPost('http://localhost:8000/adduser').reply(409, { error: 'Username already exists' });

    fillAndSubmitForm('testUser', 'testPassword');

    await waitFor(() => {
      expect(screen.getByText('Username already exists')).toBeInTheDocument();
    });
  });

  it('should redirect if already logged in', () => {
    localStorageMock.getItem.mockReturnValue('fake-token');
    render(<AddUser />);
    expect(window.location.href).toBe('/home');
  });

  describe('navigation tests', () => {
    beforeEach(() => {
      render(<AddUser />);
    });

    it('should navigate to login page when login link is clicked', () => {
      checkNavigation(screen.getByText('Login'));
      expect(window.location.href).toBe('/login');
    });

    it('should navigate to login page when login link is activated by keyboard', () => {
      checkNavigation(screen.getByText('Login'), 'Enter');
      expect(window.location.href).toBe('/login');
    });

    it('should navigate to home page when logo is clicked', () => {
      checkNavigation(screen.getByAltText('Logo'));
      expect(window.location.href).toBe('/home');
    });

    it('should navigate to home page when logo is activated by keyboard', () => {
      checkNavigation(screen.getByAltText('Logo'), 'Enter');
      expect(window.location.href).toBe('/home');
    });
  });
});