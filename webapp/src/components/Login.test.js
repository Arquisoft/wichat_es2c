import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import Login from "./Login";

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

describe('Login component', () => {
    beforeEach(() => {
        mockAxios.reset();
        localStorageMock.clear();
        window.location.href = '';
        jest.clearAllMocks();
    });

    it('should render login form correctly', () => {
        render(<Login />);

        expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
        expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    });

    it('should log in successfully', async () => {
        render(<Login />);

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByRole('button', { name: /Login/i });

        mockAxios.onPost('http://localhost:8000/login').reply(200, {
            token: 'fake-token',
            username: 'testUser'
        });

        fireEvent.change(usernameInput, { target: { value: 'testUser' } });
        fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'fake-token');
            expect(localStorageMock.setItem).toHaveBeenCalledWith('username', 'testUser');
        });

        await waitFor(() => {
            expect(window.location.href).toBe('/home');
        });
    });

    it('should validate user input', async () => {
        render(<Login />);

        const loginButton = screen.getByRole('button', { name: /Login/i });

        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(screen.getByText('Please enter both username and password')).toBeInTheDocument();
        });
    });

    it('should handle server error during login', async () => {
        render(<Login />);

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByRole('button', { name: /Login/i });

        mockAxios.onPost('http://localhost:8000/login').reply(401, { error: 'Invalid credentials' });

        fireEvent.change(usernameInput, { target: { value: 'testUser' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongPassword' } });

        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('should redirect if already logged in', () => {
        localStorageMock.getItem.mockReturnValue('fake-token');

        render(<Login />);

        expect(window.location.href).toBe('/home');
    });

    it('should navigate to home page when logo is clicked', () => {
        render(<Login />);

        const logo = screen.getByAltText('Logo');
        fireEvent.click(logo);

        expect(window.location.href).toBe('/home');
    });

    it('should navigate to home page when logo is activated by keyboard', () => {
        render(<Login />);

        const logo = screen.getByAltText('Logo');
        fireEvent.keyDown(logo, { key: 'Enter' });

        expect(window.location.href).toBe('/home');
    });

    it('should disable form fields and button during login process', async () => {
        render(<Login />);

        const usernameInput = screen.getByLabelText(/Username/i);
        const passwordInput = screen.getByLabelText(/Password/i);
        const loginButton = screen.getByRole('button', { name: /Login/i });

        mockAxios.onPost('http://localhost:8000/login').reply(() => {
            return new Promise(resolve => {
                setTimeout(() => resolve([200, { token: 'fake-token', username: 'testUser' }]), 100);
            });
        });

        fireEvent.change(usernameInput, { target: { value: 'testUser' } });
        fireEvent.change(passwordInput, { target: { value: 'testPassword' } });

        fireEvent.click(loginButton);

        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(loginButton).toBeDisabled();

        expect(screen.getByRole('progressbar')).toBeInTheDocument();

        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'fake-token');
        });
    });
});
