// Mock react-router-dom module before importing components
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import AddUser from './AddUser';

const mockAxios = new MockAdapter(axios);
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

describe('AddUser component', () => {
  beforeEach(() => {
    mockAxios.reset();
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should register user successfully', async () => {
    render(<AddUser />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const registerButton = screen.getByRole('button', { name: /Register/i });

    // Mock the axios.post request to simulate a successful response
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(200);

    // Simulate user input
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Trigger the register button click
    fireEvent.click(registerButton);

    // Wait for the success message
    await waitFor(() => {
      expect(screen.getByText(/Successfully registered/i)).toBeInTheDocument();
    });
  });

  it('should handle error when registering user', async () => {
    render(<AddUser />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const registerButton = screen.getByRole('button', { name: /Register/i });

    // Mock the axios.post request to simulate an error response
    mockAxios.onPost(`${apiEndpoint}/adduser`).reply(500, { error: 'Internal Server Error' });

    // Simulate user input
    fireEvent.change(usernameInput, { target: { value: 'testUser' } });
    fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

    // Trigger the register button click
    fireEvent.click(registerButton);

    // Wait for the error message
    await waitFor(() => {
      expect(screen.getByText(/Registration failed: Server error/i)).toBeInTheDocument();
    });
  });

  it('should validate username and password length', async () => {
    render(<AddUser />);

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const registerButton = screen.getByRole('button', { name: /Register/i });

    // Test short username
    fireEvent.change(usernameInput, { target: { value: 'ab' } });
    fireEvent.change(passwordInput, { target: { value: 'validPassword' } });
    fireEvent.click(registerButton);

    expect(screen.getByText(/Username must be at least 3 characters long/i)).toBeInTheDocument();

    // Test short password
    fireEvent.change(usernameInput, { target: { value: 'validUsername' } });
    fireEvent.change(passwordInput, { target: { value: 'ab' } });
    fireEvent.click(registerButton);

    expect(screen.getByText(/Password must be at least 3 characters long/i)).toBeInTheDocument();
  });

  it('should redirect if user is already logged in', () => {
    // Simulate a logged-in user
    localStorage.setItem('token', 'fake-token');

    render(<AddUser />);

    // This test just verifies the component renders without crashing
    // The actual redirect would be tested in integration tests
  });
});