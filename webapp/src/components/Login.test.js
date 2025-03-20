// Mock react-router-dom module before importing components
jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
    Link: ({ children, to }) => <a href={to}>{children}</a>
}));

import React from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Login from "./Login";

// Mock localStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: jest.fn(key => store[key]),
        setItem: jest.fn((key, value) => {
            store[key] = value.toString();
        }),
        clear: jest.fn(() => {
            store = {};
        }),
        removeItem: jest.fn(key => {
            delete store[key];
        })
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const mockAxios = new MockAdapter(axios);
const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000';

describe('Login component', () => {
    beforeEach(() => {
        mockAxios.reset();
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('should log in successfully', async () => {
        render(<Login />);

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByRole('button', { name: /Login/i });

        // Mock the axios.post request to simulate a successful response
        mockAxios.onPost(`${apiEndpoint}/login`).reply(200, {
            token: 'test-token',
            createdAt: '2024-01-01T12:34:56Z'
        });
        mockAxios.onPost(`${apiEndpoint}/askllm`).reply(200, {
            answer: 'Hello test user'
        });

        // Simulate user input
        await act(async () => {
            fireEvent.change(usernameInput, { target: { value: 'testUser' } });
            fireEvent.change(passwordInput, { target: { value: 'testPassword' } });
            fireEvent.click(loginButton);
        });

        // Verify localStorage was updated with the token
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'test-token');

        // Verify that the user information is displayed
        await waitFor(() => {
            expect(screen.getByText(/Your account was created on 1\/1\/2024/i)).toBeInTheDocument();
        });
    });

    it('should handle error when logging in', async () => {
        render(<Login />);

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByRole('button', { name: /Login/i });

        // Mock the axios.post request to simulate an error response
        mockAxios.onPost(`${apiEndpoint}/login`).reply(401, { error: 'Unauthorized' });

        // Simulate user input
        fireEvent.change(usernameInput, { target: { value: 'testUser' } });
        fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

        // Trigger the login button click
        fireEvent.click(loginButton);

        // Wait for the error message to be displayed
        await waitFor(() => {
            expect(screen.getByText(/Error: Unauthorized/i)).toBeInTheDocument();
        });

        // Verify that the token was not stored in localStorage
        expect(localStorage.setItem).not.toHaveBeenCalledWith('token', expect.anything());

        // Verify that the user information is not displayed
        expect(screen.queryByText(/Hello testUser!/i)).toBeNull();
        expect(screen.queryByText(/Your account was created on/i)).toBeNull();
    });
});