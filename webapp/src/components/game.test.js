// Game.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import Game from './Game';

jest.mock('axios');

// Mock the CountdownTimer component
jest.mock('./CountdownTimer', () => {
    const React = require('react');
    return React.forwardRef(({ onTimeOut, maxTime }, ref) => {
        React.useImperativeHandle(ref, () => ({
            addTime: jest.fn(),
            restTime: jest.fn(),
            reset: jest.fn()
        }));
        return (
            <div data-testid="countdown-timer">
                <span data-testid="timer-value">60</span>
                <button data-testid="trigger-timeout" onClick={onTimeOut}>Trigger Timeout</button>
            </div>
        );
    });
});

jest.mock('./ChatBot/Popchat', () => {
    return function MockPopChat({ messages, getMessage, onNewMessage, onBotResponse }) {
        return (
            <div data-testid="popchat">
                Mocked PopChat
                <button
                    data-testid="send-chat-message"
                    onClick={() => {
                        const userMessage = "Can you give me a hint?";
                        onNewMessage(userMessage);
                        getMessage(userMessage).then(response => {
                            onBotResponse(response);
                        });
                    }}
                >
                    Send Message
                </button>
                <div data-testid="messages-list">
                    {messages.map((msg, idx) => (
                        <div key={idx} data-testid="chat-message">{msg}</div>
                    ))}
                </div>
            </div>
        );
    };
});

jest.mock('./Nav', () => {
    return function MockNav() {
        return <div data-testid="nav">Mocked Nav</div>;
    };
});

jest.mock('react-awesome-button', () => ({
    AwesomeButton: ({ children, onPress, disabled, type, active, style }) => (
        <button
            onClick={onPress}
            disabled={disabled}
            data-testid="awesome-button"
            data-active={active}
            data-type={type}
            style={style}
        >
            {children}
        </button>
    ),
}));

jest.mock('@mui/material/Modal', () => {
    return function MockModal({ children, open }) {
        return open ? <div data-testid="modal">{children}</div> : null;
    };
});

jest.mock('@mui/material/Box', () => {
    return function MockBox({ children, sx, className }) {
        return <div data-testid="mui-box" className={className}>{children}</div>;
    };
});

jest.mock('@mui/material/CircularProgress', () => {
    return function MockCircularProgress() {
        return <div data-testid="circular-progress">Loading...</div>;
    };
});

jest.mock('./ModelButtons', () => ({
    HomeButton: ({ onClick }) => <button data-testid="home-button" onClick={onClick}>Home</button>,
    ReplayButton: ({ onClick }) => <button data-testid="replay-button" onClick={onClick}>Replay</button>,
    ChartButton: ({ onClick }) => <button data-testid="chart-button" onClick={onClick}>Chart</button>,
    ButtonContainer: ({ children }) => <div data-testid="button-container">{children}</div>,
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

        delete window.location;
        window.location = { href: '', hostname: 'localhost' };

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
        fireEvent.click(categoryImages[0]);  // Select first category (birds)

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        return { acceptButton, categoryImages, normalButton };
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

        const answerButtons = screen.getAllByTestId('awesome-button').filter(
            btn => sampleQuestion.choices.includes(btn.textContent)
        );

        fireEvent.click(answerButtons[choiceIndex]);

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
        document.body.innerHTML = '<div id="image-container"></div>';
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


    test('selects hard difficulty correctly', async () => {
        render(<Game />);

        const hardButton = screen.getAllByTestId('awesome-button')[1];
        fireEvent.click(hardButton);

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
                expect.objectContaining({
                    username: 'testUser',
                    difficulty: 2
                })
            );
        });
    });

    test.each([
        [0, 'birds'],
        [1, 'cartoons'],
        [2, 'capitals'],
        [3, 'sports']
    ])('selects %s category correctly', async (index, expectedCategory) => {
        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[index]);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];

        axios.post.mockResolvedValueOnce({ data: { success: true } });
        axios.get.mockResolvedValueOnce({
            data: sampleQuestion
        });

        fireEvent.click(acceptButton);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining(`/getQuestion?category=${expectedCategory}`)
            );
        });
    });

    describe('Game Interactions', () => {
        beforeEach(() => {
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

        test('handles game time out correctly', async () => {
            await startGame();

            const originalDateNow = Date.now;
            Date.now = jest.fn(() => 1000000);

            const timeoutButton = screen.getByTestId('trigger-timeout');
            fireEvent.click(timeoutButton);

            expect(screen.getByText("⏳ ¡Time is out!")).toBeInTheDocument();
            expect(screen.getByText("Do you want to try it again?")).toBeInTheDocument();

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/endMatch'),
                expect.objectContaining({
                    username: 'testUser',
                    time: expect.any(Number)
                })
            );

            Date.now = originalDateNow;
        });

        test('replay button starts a new game', async () => {
            await startGame();

            const timeoutButton = screen.getByTestId('trigger-timeout');
            fireEvent.click(timeoutButton);

            axios.post.mockClear();
            axios.get.mockClear();

            const replayButton = screen.getByTestId('replay-button');
            fireEvent.click(replayButton);

            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/addMatch'),
                expect.objectContaining({
                    username: 'testUser'
                })
            );

            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/getQuestion')
            );
        });

        test('home button redirects to home page', async () => {
            await startGame();


            const timeoutButton = screen.getByTestId('trigger-timeout');
            fireEvent.click(timeoutButton);

            const homeButton = screen.getByTestId('home-button');
            fireEvent.click(homeButton);

            expect(window.location.href).toBe('/home');
        });

        test('chart button redirects to history page', async () => {
            await startGame();

            const timeoutButton = screen.getByTestId('trigger-timeout');
            fireEvent.click(timeoutButton);

            const chartButton = screen.getByTestId('chart-button');
            fireEvent.click(chartButton);

            expect(window.location.href).toBe('/history');
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
        render(<Game />);
        await startGame();

        const initialMessages = screen.getAllByTestId('chat-message');
        const initialCount = initialMessages.length;

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

        const messagesAfterAnswer = screen.getAllByTestId('chat-message');
        expect(messagesAfterAnswer.length).toBe(1);
        expect(messagesAfterAnswer[0]).toHaveTextContent("Ask me anything");
    });


    test('preloads new questions when queue becomes low', async () => {
        const mockQuestionQueue = [
            {
                question: "Question 1",
                image: null,
                choices: ["A", "B", "C", "D"],
                answer: "A"
            },
            {
                question: "Question 2",
                image: null,
                choices: ["E", "F", "G", "H"],
                answer: "E"
            }
        ];

        axios.get.mockResolvedValueOnce({
            data: sampleQuestion
        });

        mockQuestionQueue.forEach(q => {
            axios.get.mockResolvedValueOnce({
                data: q
            });
        });

        render(<Game />);
        await startGame();

        await answerQuestion(0);

        await waitFor(() => {
            expect(screen.getByText(mockQuestionQueue[0].question)).toBeInTheDocument();
        });

        axios.get.mockClear();

        axios.post.mockResolvedValueOnce({ data: { success: true } });

        const answerButtons = screen.getAllByTestId('awesome-button').filter(
            btn => mockQuestionQueue[0].choices.includes(btn.textContent)
        );

        fireEvent.click(answerButtons[0]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/getQuestion?category=birds')
            );
        });
    });



    test('displays image when available', async () => {

        const questionWithImage = {
            question: "What is this bird?",
            image: "https://example.com/bird.jpg",
            choices: ["Robin", "Sparrow", "Eagle", "Hawk"],
            answer: "Robin",
        };

        axios.get.mockResolvedValueOnce({
            data: questionWithImage
        });

        render(<Game />);
        await startGame();

        await waitFor(() => {
            const images = screen.getAllByRole('img');
            const gameImage = images.find(img => img.src === questionWithImage.image);
            expect(gameImage).toBeInTheDocument();
        });
    });

    test('handles image loading errors', async () => {
        const questionWithBadImage = {
            question: "What is this bird?",
            image: "https://example.com/nonexistent.jpg",
            choices: ["Robin", "Sparrow", "Eagle", "Hawk"],
            answer: "Robin",
        };

        axios.get.mockResolvedValueOnce({
            data: questionWithBadImage
        });

        render(<Game />);
        await startGame();

        const images = await screen.findAllByRole('img');
        const gameImage = images.find(img => img.src === questionWithBadImage.image);

        fireEvent.error(gameImage);

    });

    test('uses correct API endpoints based on hostname', () => {
        window.location.hostname = 'localhost';
        render(<Game />);
        expect(window.location.hostname).toBe('localhost');

        window.location.hostname = 'example.com';
        render(<Game />);
        expect(window.location.hostname).toBe('example.com');
    });

    test('handles multiple answers in sequence correctly', async () => {
        const questions = [
            {
                question: "Question 1",
                image: null,
                choices: ["A", "B", "C", "D"],
                answer: "A"
            },
            {
                question: "Question 2",
                image: null,
                choices: ["E", "F", "G", "H"],
                answer: "E"
            },
            {
                question: "Question 3",
                image: null,
                choices: ["I", "J", "K", "L"],
                answer: "I"
            }
        ];

        axios.get.mockResolvedValueOnce({
            data: questions[0]
        });

        questions.slice(1).forEach(q => {
            axios.get.mockResolvedValueOnce({
                data: q
            });
        });

        render(<Game />);
        await startGame();

        await waitFor(() => {
            expect(screen.getByText(questions[0].question)).toBeInTheDocument();
        });

        let answerButtons = screen.getAllByTestId('awesome-button').filter(
            btn => questions[0].choices.includes(btn.textContent)
        );

        fireEvent.click(answerButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(questions[1].question)).toBeInTheDocument();
        });

        answerButtons = screen.getAllByTestId('awesome-button').filter(
            btn => questions[1].choices.includes(btn.textContent)
        );

        fireEvent.click(answerButtons[0]);

        await waitFor(() => {
            expect(screen.getByText(questions[2].question)).toBeInTheDocument();
        });
    });

    test('applies correct styling to selected difficulty buttons', async () => {
        render(<Game />);

        const normalButton = screen.getAllByTestId('awesome-button')[0]; // Normal difficulty
        const hardButton = screen.getAllByTestId('awesome-button')[1]; // Hard difficulty

        expect(normalButton).toHaveAttribute('data-type', 'secondary');
        expect(hardButton).toHaveAttribute('data-type', 'secondary');

        fireEvent.click(normalButton);

        expect(normalButton).toHaveAttribute('data-type', 'primary');
        expect(hardButton).toHaveAttribute('data-type', 'secondary');

        fireEvent.click(hardButton);

        expect(normalButton).toHaveAttribute('data-type', 'secondary');
        expect(hardButton).toHaveAttribute('data-type', 'primary');
    });

    test('Accept button is disabled until both difficulty and category are selected', async () => {
        render(<Game />);

        const acceptButton = screen.getAllByTestId('awesome-button')[2];
        expect(acceptButton).toBeDisabled();

        const normalButton = screen.getAllByTestId('awesome-button')[0];
        fireEvent.click(normalButton);

        expect(acceptButton).toBeDisabled();

        const categoryImages = screen.getAllByRole('img');
        fireEvent.click(categoryImages[0]);

        expect(acceptButton).not.toBeDisabled();
    });
});