import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Login from "./Login";

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

describe('Login component', () => {
    beforeEach(() => {
        mockAxios.reset();
        localStorageMock.clear();
        window.location.href = '';
        jest.clearAllMocks();
    });

    it('should log in successfully', async () => {
        render(<Login />);

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByRole('button', { name: /Login/i });

        // Mock the axios.post request to simulate a successful response
        mockAxios.onPost('http://localhost:8000/login').reply(200, {
            token: 'fake-token',
            username: 'testUser'
        });

        // Simulate user input
        fireEvent.change(usernameInput, { target: { value: 'testUser' } });
        fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

        // Trigger the login button click
        fireEvent.click(loginButton);

        // Verify localStorage was updated
        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'fake-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'testUser');
        });

        // Verify isLoggedIn was updated (should trigger redirect)
        await waitFor(() => {
            expect(window.location.href).toBe('/home');
        });
    });


    it('should validate user input', async () => {
        render(<Login />);

        const loginButton = screen.getByRole('button', { name: /Login/i });

        // Test with empty fields
        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
        });
    });

    it('should redirect if already logged in', () => {
        // Set token to simulate logged-in state
        localStorageMock.getItem.mockReturnValue('fake-token');

        render(<Login />);

        expect(window.location.href).toBe('/home');
    });
});