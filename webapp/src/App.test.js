import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from "./Home";

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
    useNavigate: () => jest.fn(),
    Link: ({ children, to }) => <a href={to}>{children}</a>
}));

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

describe('Home component', () => {
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test('renders welcome message when not logged in', () => {
        // Ensure localStorage.getItem('token') returns null to simulate not logged in
        localStorage.getItem.mockReturnValue(null);

        render(<Home />);
        const welcomeMessage = screen.getByText(/Log in to play/i);
        expect(welcomeMessage).toBeInTheDocument();
    });

    test('renders content when logged in', () => {
        // Mock being logged in
        localStorage.getItem.mockReturnValue('test-token');

        render(<Home />);
        // Add appropriate assertions based on what your Home component displays when logged in
        // For example:
        // expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();

        // If you can't make specific assertions without seeing the actual component,
        // at least verify the login message is not displayed
        expect(screen.queryByText(/Log in to play/i)).not.toBeInTheDocument();
    });
});