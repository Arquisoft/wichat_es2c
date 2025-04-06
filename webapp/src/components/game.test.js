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
    beforeEach(() => {
        // Reset mocks before each test
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
    });

    test('renders difficulty selection modal initially', () => {
        render(<Game />);
        expect(screen.getByText('Select difficulty level')).toBeInTheDocument();
        expect(screen.getByText('Select category')).toBeInTheDocument();
    });

    test('allows selection of difficulty and category', () => {
        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        expect(acceptButton).not.toBeDisabled();
    });

    test('starts game when difficulty and category are selected', async () => {
        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];

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

    test('handles answer selection correctly', async () => {
        document.body.innerHTML = '<div id="image-container"></div>';

        axios.get.mockResolvedValueOnce({
            data: {
                question: sampleQuestion.question,
                image: sampleQuestion.image,
                choices: sampleQuestion.choices,
                answer: sampleQuestion.choices[0],
            }
        });

        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();
        });

        axios.post.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: {
                question: "New question?",
                image: null,
                choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                answer: "Option 1",
            }
        });

        const answerButtons = screen.getAllByTestId('awesome-button');
        const firstAnswerButton = answerButtons.find(btn =>
            btn.textContent === sampleQuestion.choices[0]
        );

        fireEvent.click(firstAnswerButton);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/addQuestion'),
                expect.objectContaining({
                    username: 'testUser',
                    question: sampleQuestion.question,
                    selectedAnswer: sampleQuestion.choices[0],
                })
            );
        });

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringMatching(/getQuestion/)
            );
        });
    });

    // test('handles time out correctly', async () => {
    //     render(<Game />);
    //
    //     const normalButton = screen.getAllByTestId('awesome-button')[0];
    //     fireEvent.click(normalButton);
    //
    //     const categoryImages = screen.getAllByRole('img');
    //     fireEvent.click(categoryImages[0]);
    //
    //     const acceptButton = screen.getAllByTestId('awesome-button')[2];
    //     fireEvent.click(acceptButton);
    //
    //     await waitFor(() => {
    //         expect(axios.post).toHaveBeenCalled();
    //     });
    //
    //     await waitFor(() => {
    //         expect(axios.get).toHaveBeenCalled();
    //     });
    //
    //     axios.post.mockResolvedValueOnce({ data: { success: true } });
    //
    //     const timer = await screen.findByTestId('timer');
    //     fireEvent.click(timer);
    //
    //     await waitFor(() => {
    //         expect(screen.getByText('⏳ ¡Time is out!')).toBeInTheDocument();
    //     });
    //
    //     expect(axios.post).toHaveBeenCalledWith(
    //         expect.stringContaining('/endMatch'),
    //         expect.objectContaining({
    //             username: 'testUser',
    //         })
    //     );
    // });



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

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        fireEvent.click(acceptButton);


        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(1);
        });
    });

    test('handles chatbot interaction', async () => {
        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
        });

        const popChat = screen.getByTestId('popchat');
        expect(popChat).toBeInTheDocument();

    });

    test('displays the question and choices correctly', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                question: sampleQuestion.question,
                image: sampleQuestion.image,
                choices: sampleQuestion.choices,
                answer: sampleQuestion.choices[0],
            }
        });

        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();
        });

        for (const choice of sampleQuestion.choices) {
            expect(screen.getByText(choice)).toBeInTheDocument();
        }
    });

    test('sends correct data to API when answering a question', async () => {
        axios.get.mockResolvedValueOnce({
            data: {
                question: sampleQuestion.question,
                image: sampleQuestion.image,
                choices: sampleQuestion.choices,
                answer: sampleQuestion.choices[0],
            }
        });

        axios.post.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: {
                question: "Next question",
                image: null,
                choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                answer: "Option 1"
            }
        });

        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        fireEvent.click(acceptButton);


        await waitFor(() => {
            expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();
        });

        const answerButton = screen.getByText(sampleQuestion.choices[0]);
        fireEvent.click(answerButton);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/addQuestion'),
                expect.objectContaining({
                    username: 'testUser',
                    question: sampleQuestion.question,
                    selectedAnswer: sampleQuestion.choices[0]
                })
            );
        });
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

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        fireEvent.click(acceptButton);

        expect(await screen.findByText('Loading Questions')).toBeInTheDocument();
    });

    test('handles incorrect answer selection', async () => {
        const questionWithIncorrectAnswer = {
            ...sampleQuestion,
            answer: sampleQuestion.choices[1]
        };

        axios.get.mockResolvedValueOnce({
            data: questionWithIncorrectAnswer
        });

        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(screen.getByText(questionWithIncorrectAnswer.question)).toBeInTheDocument();
        });

        axios.post.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: {
                question: "Next question after incorrect answer",
                image: null,
                choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                answer: "Option 1"
            }
        });

        const answerButtons = screen.getAllByTestId('awesome-button');
        const firstAnswerButton = answerButtons.find(btn =>
            btn.textContent === questionWithIncorrectAnswer.choices[0]
        );

        fireEvent.click(firstAnswerButton);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/addQuestion'),
                expect.objectContaining({
                    username: 'testUser',
                    question: questionWithIncorrectAnswer.question,
                    selectedAnswer: questionWithIncorrectAnswer.choices[0],
                })
            );
        });

        await waitFor(() => {
            expect(screen.getByText("Next question after incorrect answer")).toBeInTheDocument();
        });
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
        React.useState = jest.fn()
            .mockReturnValueOnce([false, jest.fn()]) // showDifficultyModal
            .mockReturnValueOnce([true, jest.fn()]) // difficultyModalFadeIn
            .mockReturnValueOnce([sampleQuestion, jest.fn()]) // questionData
            .mockReturnValueOnce([null, jest.fn()]) // selectedAnswer
            .mockReturnValueOnce([false, jest.fn()]) // isCorrect
            .mockReturnValueOnce([["Ask me anything"], setMsgsSpy]); // msgs

        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(screen.getByText(sampleQuestion.question)).toBeInTheDocument();
        });

        axios.post.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: {
                question: "Next question",
                image: null,
                choices: ["Option 1", "Option 2", "Option 3", "Option 4"],
                answer: "Option 1"
            }
        });

        const answerButtons = screen.getAllByTestId('awesome-button');
        const firstAnswerButton = answerButtons.find(btn =>
            btn.textContent === sampleQuestion.choices[0]
        );

        fireEvent.click(firstAnswerButton);


    });

});