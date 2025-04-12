// Game.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
    AwesomeButton: ({ children, onPress, disabled }) => (
        <button onClick={onPress} disabled={disabled} data-testid="awesome-button">
            {children}
        </button>
    ),
}));

const sampleQuestion = {
    question: "What is the capital of France?",
    image: "https://example.com/paris.jpg",
    choices: ["Paris", "London", "Berlin", "Madrid"],
    answer: "Paris",
};

describe('Game Component', () => {
    const setupTestEnvironment = () => {
        jest.clearAllMocks();

        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(() => 'testUser'),
                setItem: jest.fn(),
            },
            writable: true
        });

        axios.get.mockResolvedValue({
            data: {
                question: sampleQuestion.question,
                image: sampleQuestion.image,
                choices: sampleQuestion.choices,
                answer: sampleQuestion.choices[0],
            }
        });

        axios.post.mockResolvedValue({ data: { success: true } });
    };

    const selectDifficultyAndCategory = async () => {
        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        return { acceptButton, categoryImages };
    };

    const startGame = async () => {
        const { acceptButton } = await selectDifficultyAndCategory();
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
        });
    };

    const answerQuestion = async (choiceIndex = 0) => {
        await waitFor(() => {
            expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();
        });

        const answerButtons = screen.getAllByTestId('awesome-button');
        const targetButton = answerButtons.find(btn =>
            btn.textContent === sampleQuestion.choices[choiceIndex]
        );

        fireEvent.click(targetButton);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/addQuestion'),
                expect.objectContaining({
                    username: 'testUser',
                    question: sampleQuestion.question,
                    selectedAnswer: sampleQuestion.choices[choiceIndex],
                })
            );
        });
    };

    beforeEach(() => {
        setupTestEnvironment();
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

        axios.post.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: sampleQuestion
        });

        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/addMatch'),
                expect.objectContaining({ username: 'testUser' })
            );
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
        });
    });

    describe('Game Interactions', () => {
        beforeEach(() => {
            document.body.innerHTML = '<div id="image-container"></div>';
            render(<Game />);
        });

        test('handles answer selection correctly', async () => {
            await startGame();

            axios.post.mockResolvedValueOnce({ data: { success: true } });
            axios.get.mockResolvedValueOnce({
                data: {
                    question: "New question?",
                    image: null,
                    choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                    answer: "Option 1",
                }
            });

            await answerQuestion(0);

            await waitFor(() => {
                expect(axios.get).toHaveBeenCalledWith(
                    expect.stringMatching(/getQuestion/)
                );
            });
        });

        test('displays the question and choices correctly', async () => {
            await startGame();

            await waitFor(() => {
                expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();
            });

            for (const choice of sampleQuestion.choices) {
                expect(screen.getByText(choice)).toBeInTheDocument();
            }
        });

        test('sends correct data to API when answering a question', async () => {
            await startGame();

            axios.post.mockResolvedValueOnce({ data: { success: true } });
            axios.get.mockResolvedValueOnce({
                data: {
                    question: "Next question",
                    image: null,
                    choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                    answer: "Option 1"
                }
            });

            await answerQuestion(0);
        });

        test('handles incorrect answer selection', async () => {
            const questionWithIncorrectAnswer = {
                ...sampleQuestion,
                answer: sampleQuestion.choices[1]
            };

            axios.get.mockResolvedValueOnce({
                data: questionWithIncorrectAnswer
            });

            await startGame();

            axios.post.mockResolvedValueOnce({ data: { success: true } });
            axios.get.mockResolvedValueOnce({
                data: {
                    question: "Next question after incorrect answer",
                    image: null,
                    choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                    answer: "Option 1"
                }
            });

            await answerQuestion(0);

            await waitFor(() => {
                expect(screen.getByText("Next question after incorrect answer")).toBeInTheDocument();
            });
        });
    });

    test('preloads questions properly', async () => {
        axios.get.mockImplementation(() => Promise.resolve({
            data: {
                question: "Preloaded question?",
                image: null,
                choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                answer: "Option 1",
            }
        }));

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
        axios.get.mockImplementationOnce(() =>
            new Promise(resolve => setTimeout(() =>
                resolve({
                    data: sampleQuestion
                }), 100)
            )
        );

        render(<Game />);
        const { acceptButton } = await selectDifficultyAndCategory();
        fireEvent.click(acceptButton);

        expect(await screen.findByText('Loading Questions')).toBeInTheDocument();
    });

    test('category selection works correctly', async () => {
        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryLabels = ["Birds", "Cartoons", "Capitals", "Sports"];
        for (const label of categoryLabels) {
            expect(screen.getByText(label)).toBeInTheDocument();
        }

        const categoryImages = screen.getAllByRole('img');
        const categoryToSelect = categoryImages[1];
        fireEvent.click(categoryToSelect);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        expect(acceptButton).not.toBeDisabled();

        axios.post.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: sampleQuestion
        });

        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/getQuestion?category=cartoons')
            );
        });
    });

    test('clears chat when moving to next question', async () => {
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

        axios.post.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: {
                question: "Next question",
                image: null,
                choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                answer: "Option 1"
            }
        });

        await answerQuestion(0);

        React.useState.mockRestore();
    });
});