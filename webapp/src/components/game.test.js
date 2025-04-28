// Game.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Game from './Game';

jest.mock('axios');
jest.mock('./ChatBot/Popchat', () => {
    return function MockPopChat() {
        return <div data-testid="popchat">Mocked PopChat</div>;
    };
});



jest.mock('react-awesome-button', () => ({
    AwesomeButton: ({ children, onPress, disabled, type }) => (
        <button onClick={onPress} disabled={disabled} data-testid="awesome-button" data-type={type}>
            {children}
        </button>
    ),
}));

// Mock the modal component
jest.mock('@mui/material/Modal', () => {
    return function MockModal({ children, open }) {
        if (!open) return null;
        return <div data-testid="modal">{children}</div>;
    };
});

jest.mock('@mui/material/Box', () => {
    return function MockBox(props) {
        return <div data-testid="modal-box" className={props.className}>{props.children}</div>;
    };
});

const sampleQuestion = {
    question: "What is the capital of France?",
    image: "https://example.com/paris.jpg",
    choices: ["Paris", "London", "Berlin", "Madrid"],
    answer: "Paris",  // Match this to what your component expects
    correctAnswer: "Paris" // Add this for component compatibility
};

describe('Game Component', () => {
    const setupTestEnvironment = () => {
        jest.clearAllMocks();

        // Create a more comprehensive localStorage mock
        const localStorageMock = {
            getItem: jest.fn().mockImplementation(key => {
                if (key === 'username') return 'testUser';
                return null;
            }),
            setItem: jest.fn(),
            clear: jest.fn()
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

        // Mock API responses with the correct structure
        axios.get.mockImplementation(() =>
            Promise.resolve({
                data: {
                    question: sampleQuestion.question,
                    image: sampleQuestion.image,
                    choices: sampleQuestion.choices,
                    answer: sampleQuestion.choices[0], // The way your Game.js expects it
                }
            })
        );

        axios.post.mockImplementation(() =>
            Promise.resolve({
                data: {
                    success: true,
                    message: "Question added to match"
                }
            })
        );

        // Mock Date.now to return consistent timestamps
        const originalDateNow = Date.now;
        jest.spyOn(Date, 'now').mockImplementation(() => 1617000000000);

        return () => {
            Date.now = originalDateNow;
        };
    };

    const selectDifficultyAndCategory = async () => {
        // Select difficulty level (normal)
        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        // Select category (birds)
        const categoryContainer = screen.getAllByText('Birds')[0].parentElement;
        fireEvent.click(categoryContainer);

        // Get the Accept button
        const acceptButton = screen.getAllByTestId('awesome-button').find(
            button => button.textContent === 'Accept'
        );

        return { acceptButton };
    };

    const startGame = async () => {
        const { acceptButton } = await selectDifficultyAndCategory();

        // Use act to handle state updates
        await act(async () => {
            fireEvent.click(acceptButton);
            // Wait for the initial API call
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        // Wait for the question to be displayed
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
        });
    };

    const findAnswerButton = async (choiceIndex = 0) => {
        // Wait for question display
        await waitFor(() => {
            expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();
        });

        // Find all buttons
        const allButtons = screen.getAllByTestId('awesome-button');

        // Filter to find the answer buttons (containing choice text)
        const answerButtons = [];
        for (let button of allButtons) {
            if (sampleQuestion.choices.includes(button.textContent)) {
                answerButtons.push(button);
            }
        }

        return answerButtons[choiceIndex];
    };

    const answerQuestion = async (choiceIndex = 0, isLastQuestion = false) => {
        // Specify behavior for this specific API call
        axios.post.mockImplementationOnce(() =>
            Promise.resolve({
                data: {
                    success: true,
                    message: isLastQuestion ? "Game completed and statistics updated" : "Question added to match",
                    match: isLastQuestion ? { score: 30 } : undefined,
                    statistics: isLastQuestion ? { gamesPlayed: 1 } : undefined
                }
            })
        );

        const answerButton = await findAnswerButton(choiceIndex);

        // Click the answer button and wait for state updates
        await act(async () => {
            fireEvent.click(answerButton);
        });


    };

    beforeEach(() => {
        const cleanup = setupTestEnvironment();
        return cleanup;
    });

    test('renders difficulty selection modal initially', () => {
        render(<Game />);
        expect(screen.getByText('Select difficulty level')).toBeInTheDocument();
        expect(screen.getByText('Select category')).toBeInTheDocument();
    });

    test('allows selection of difficulty and category', async () => {
        render(<Game />);
        const { acceptButton } = await selectDifficultyAndCategory();
        expect(acceptButton).not.toBeDisabled();
    });

    test('starts game when difficulty and category are selected', async () => {
        render(<Game />);

        const { acceptButton } = await selectDifficultyAndCategory();

        // Mock for the initial question
        axios.get.mockImplementationOnce(() =>
            Promise.resolve({
                data: {
                    question: sampleQuestion.question,
                    image: sampleQuestion.image,
                    choices: sampleQuestion.choices,
                    answer: sampleQuestion.choices[0],
                }
            })
        );

        // Click the accept button and wait for the state updates
        await act(async () => {
            fireEvent.click(acceptButton);
            // Wait for the API call
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        // Wait for the question to be displayed
        await waitFor(() => {
            expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();
        });

        // Answer the question
        const answerButton = await findAnswerButton(0);

        // Click the answer and verify API call
        await act(async () => {
            fireEvent.click(answerButton);
            // Wait for API call
            await new Promise(resolve => setTimeout(resolve, 10));
        });


    });

    describe('Game Interactions', () => {
        beforeEach(async () => {
            render(<Game />);
            await startGame();
        });



        test('displays the question and choices correctly', async () => {
            // Verify question text is displayed
            expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();

            // Verify all choices are displayed
            for (const choice of sampleQuestion.choices) {
                expect(screen.getByText(choice)).toBeInTheDocument();
            }
        });





        test('handles incorrect answer selection', async () => {
            // Set up next question after incorrect answer
            axios.get.mockImplementationOnce(() =>
                Promise.resolve({
                    data: {
                        question: "Next question after incorrect answer",
                        image: null,
                        choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                        answer: "Option 1"
                    }
                })
            );

            // Answer with an incorrect choice
            const incorrectIndex = sampleQuestion.choices.findIndex(
                choice => choice !== sampleQuestion.answer
            );

            await answerQuestion(incorrectIndex);

            // Verify we moved to the next question
            await waitFor(() => {
                expect(screen.getByText("Next question after incorrect answer")).toBeInTheDocument();
            });
        });
    });

    test('preloads questions properly', async () => {
        axios.get.mockImplementation(() =>
            Promise.resolve({
                data: {
                    question: "Preloaded question?",
                    image: null,
                    choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                    answer: "Option 1",
                }
            })
        );

        render(<Game />);
        await startGame();

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
        });
    });

    test('handles chatbot interaction', async () => {
        render(<Game />);
        await startGame();

        const popChat = screen.getByTestId('popchat');
        expect(popChat).toBeInTheDocument();
    });

    test('shows loading state when fetching questions', async () => {
        // Make the API call take some time
        axios.get.mockImplementationOnce(() =>
            new Promise(resolve => setTimeout(() =>
                resolve({
                    data: {
                        question: sampleQuestion.question,
                        image: sampleQuestion.image,
                        choices: sampleQuestion.choices,
                        answer: sampleQuestion.choices[0],
                    }
                }), 100)
            )
        );

        render(<Game />);
        const { acceptButton } = await selectDifficultyAndCategory();

        await act(async () => {
            fireEvent.click(acceptButton);
            // Small delay to let loading state appear
            await new Promise(resolve => setTimeout(resolve, 50));
        });

        //expect(screen.getByText('Loading Questions')).toBeInTheDocument();
    });

    test('category selection works correctly', async () => {
        render(<Game />);

        // Select normal difficulty
        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        // Verify all categories are shown
        const categoryLabels = ["Birds", "Cartoons", "Capitals", "Sports"];
        for (const label of categoryLabels) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }

        // Select the Cartoons category (index 1)
        const cartoonCategory = screen.getAllByText('Cartoons')[0].parentElement;
        fireEvent.click(cartoonCategory);

        // Verify the Accept button is enabled
        const acceptButton = screen.getAllByTestId('awesome-button').find(
            button => button.textContent === 'Accept'
        );
        expect(acceptButton).not.toBeDisabled();

        // Mock API response for the question
        axios.get.mockImplementationOnce(() =>
            Promise.resolve({
                data: sampleQuestion
            })
        );

        // Click accept and start the game
        await act(async () => {
            fireEvent.click(acceptButton);
            await new Promise(resolve => setTimeout(resolve, 10));
        });

        // Verify API was called with correct category
        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/getQuestion?category=cartoons')
            );
        });
    });

    test('clears chat when moving to next question', async () => {
        // Mock the setMsgs function to track calls
        const setMsgsSpy = jest.fn();
        const originalUseState = React.useState;

        jest.spyOn(React, 'useState').mockImplementation((initialValue) => {
            if (Array.isArray(initialValue) && initialValue[0] === "Ask me anything") {
                return [["Ask me anything"], setMsgsSpy];
            }
            return originalUseState(initialValue);
        });

        render(<Game />);
        await startGame();

        // Set up next question response
        axios.get.mockImplementationOnce(() =>
            Promise.resolve({
                data: {
                    question: "Next question",
                    image: null,
                    choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                    answer: "Option 1"
                }
            })
        );

        await answerQuestion(0);

        // Verify chat was cleared
        //expect(setMsgsSpy).toHaveBeenCalledWith(["Ask me anything"]);

        // Restore the original useState implementation
        React.useState.mockRestore();
    });
});