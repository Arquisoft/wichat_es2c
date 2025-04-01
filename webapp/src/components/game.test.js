import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react'; // Use this import for more comprehensive act coverage
import '@testing-library/jest-dom';
import axios from 'axios';
import Game from './Game';

// Mock required modules and components
jest.mock('axios');
jest.mock('./Timer', () => ({
    __esModule: true,
    default: ({ onTimeOut, initialTime, difficulty }) => (
        <div data-testid="timer">
            Timer: {initialTime}s
            <button data-testid="trigger-timeout" onClick={onTimeOut}>Trigger Timeout</button>
        </div>
    )
}));
jest.mock('./ChatBot/Popchat', () => ({
    __esModule: true,
    default: ({ messages, onNewMessage, onBotResponse, getMessage }) => (
        <div data-testid="popchat">
            <div data-testid="messages">
                {messages.map((msg, idx) => <div key={idx}>{msg}</div>)}
            </div>
            <button
                data-testid="send-message"
                onClick={async () => {
                    const userMsg = "Can you give me a hint?";
                    onNewMessage(userMsg);
                    const response = await getMessage(userMsg);
                    onBotResponse(response);
                }}
            >
                Send Message
            </button>
        </div>
    )
}));


// Mock local storage
beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
        value: {
            getItem: jest.fn().mockImplementation((key) => {
                if (key === 'username') return 'testuser';
                return null;
            }),
            setItem: jest.fn(),
            removeItem: jest.fn()
        },
        writable: true
    });
});

// Mock API responses
const mockQuestion = {
    question: "¿Cuál es la capital de Francia?",
    image: "https://example.com/paris.jpg",
    choices: ["Madrid", "Londres", "París", "Berlín"],
    answer: "París"
};

describe('Game Component', () => {
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock the preloaded questions
        axios.get.mockResolvedValue({ data: mockQuestion });

        // Mock the API calls
        axios.post.mockResolvedValue({ data: { message: 'success' } });
    });

    // Helper function for safer async testing
    const safeAct = async (callback) => {
        await act(async () => {
            await callback();
            // Add a small delay to ensure all state updates have processed
            await new Promise(resolve => setTimeout(resolve, 0));
        });
    };

    test('renders difficulty selection modal initially', async () => {
        await act(async () => {
            render(<Game />);
        });

        expect(screen.getByText('Select difficulty level')).toBeInTheDocument();
        expect(screen.getByText('Normal')).toBeInTheDocument();
        expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    test('starts game after selecting difficulty', async () => {
        await act(async () => {
            render(<Game />);
        });

        // Select difficulty
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Normal'));
        });

        // Wait for difficulty modal to disappear and game to start
        await waitFor(() => {
            expect(screen.queryByText('Select difficulty level')).not.toBeInTheDocument();
        });

        // Check if addMatch API was called with correct params
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/addMatch'),
            {
                username: 'testuser',
                difficulty: 1
            }
        );

        // Wait for question to be loaded
        await waitFor(() => {
            expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
        });
    });

    test('loads question and displays answer options', async () => {
        await act(async () => {
            render(<Game />);
        });

        // Select difficulty to start game
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Normal'));
        });

        // Wait for question to be loaded
        await waitFor(() => {
            expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
        });

        // Check if answer options are displayed
        mockQuestion.choices.forEach(choice => {
            expect(screen.getByText(choice)).toBeInTheDocument();
        });
    });

    test('handles correct answer selection', async () => {
        await act(async () => {
            render(<Game />);
        });

        // Start game
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Normal'));
        });

        // Wait for question to be loaded
        await waitFor(() => {
            expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
        });

        // Choose the correct answer
        await safeAct(async () => {
            fireEvent.click(screen.getByText('París'));
        });

        // Check if addQuestion API was called with correct params
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/addQuestion'),
                expect.objectContaining({
                    username: 'testuser',
                    question: mockQuestion.choices,
                    correctAnswer: 2, // Index of "París"
                    answers: mockQuestion.choices,
                    selectedAnswer: 'París'
                })
            );
        });
    });

    test('handles incorrect answer selection', async () => {
        await act(async () => {
            render(<Game />);
        });

        // Start game
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Normal'));
        });

        // Wait for question to be loaded
        await waitFor(() => {
            expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
        });

        // Choose an incorrect answer
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Madrid'));
        });

        // Check if addQuestion API was called with correct params
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/addQuestion'),
                expect.objectContaining({
                    username: 'testuser',
                    question: mockQuestion.choices,
                    correctAnswer: 2, // Index of "París"
                    answers: mockQuestion.choices,
                    selectedAnswer: 'Madrid'
                })
            );
        });
    });

    test('handles timeout and ends game', async () => {
        await act(async () => {
            render(<Game />);
        });

        // Start game
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Normal'));
        });

        // Wait for question to be loaded
        await waitFor(() => {
            expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
        });

        // Trigger timeout
        await safeAct(async () => {
            fireEvent.click(screen.getByTestId('trigger-timeout'));
        });

        // Check if timeout modal appears
        await waitFor(() => {
            expect(screen.getByText('⏳ ¡El tiempo se ha acabado!')).toBeInTheDocument();
        });

        // Check if endMatch API was called
        expect(axios.post).toHaveBeenCalledWith(
            expect.stringContaining('/endMatch'),
            expect.objectContaining({
                username: 'testuser',
                time: expect.any(Number)
            })
        );
    });

    test('restarts game after timeout', async () => {
        await act(async () => {
            render(<Game />);
        });

        // Start game
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Normal'));
        });

        // Wait for question to be loaded
        await waitFor(() => {
            expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
        });

        // Trigger timeout
        await safeAct(async () => {
            fireEvent.click(screen.getByTestId('trigger-timeout'));
        });

        // Wait for timeout modal
        await waitFor(() => {
            expect(screen.getByText('⏳ ¡El tiempo se ha acabado!')).toBeInTheDocument();
        });

        // Click restart button
        await safeAct(async () => {
            fireEvent.click(screen.getByText('🔄 Reintentar'));
        });

        // Check if timeout modal disappears
        await waitFor(() => {
            expect(screen.queryByText('⏳ ¡El tiempo se ha acabado!')).not.toBeInTheDocument();
        });

        // Check if addMatch API was called for a new game
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/getQuestion'));
        });
    });

    test('navigates to home after timeout', async () => {
        await act(async () => {
            render(<Game />);
        });

        // Start game
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Normal'));
        });

        // Wait for question to be loaded
        await waitFor(() => {
            expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
        });

        // Trigger timeout
        await safeAct(async () => {
            fireEvent.click(screen.getByTestId('trigger-timeout'));
        });

        // Wait for timeout modal
        await waitFor(() => {
            expect(screen.getByText('⏳ ¡El tiempo se ha acabado!')).toBeInTheDocument();
        });

        // Click home button
        await safeAct(async () => {
            fireEvent.click(screen.getByText('🏠 Volver a Inicio'));
        });

        // Check navigation function was called
        expect(navigateToHomeMock).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('chatbot interaction works correctly', async () => {
        // Mock the LLM response
        axios.post.mockImplementation((url) => {
            if (url.includes('/askllm')) {
                return Promise.resolve({ data: { answer: "This city is known as the City of Light." } });
            }
            return Promise.resolve({ data: { message: 'success' } });
        });

        await act(async () => {
            render(<Game />);
        });

        // Start game
        await safeAct(async () => {
            fireEvent.click(screen.getByText('Normal'));
        });

        // Wait for question to be loaded
        await waitFor(() => {
            expect(screen.getByText(mockQuestion.question)).toBeInTheDocument();
        });

        // Check initial chat message
        expect(screen.getByText('Ask me anything')).toBeInTheDocument();

        // Send a message
        await safeAct(async () => {
            fireEvent.click(screen.getByTestId('send-message'));
        });

        // Check if askllm API was called
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/askllm'),
                expect.objectContaining({
                    model: 'empathy',
                    userQuestion: 'Can you give me a hint?',
                    gameQuestion: mockQuestion.question,
                    answers: mockQuestion.choices,
                    correctAnswer: mockQuestion.answer
                })
            );
        });

        // Check if bot response is displayed
        await waitFor(() => {
            expect(screen.getByText('This city is known as the City of Light.')).toBeInTheDocument();
        });
    });



});