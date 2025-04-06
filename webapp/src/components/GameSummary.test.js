// GameSummary.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameSummary from './GameSummary';

jest.mock('./Questions', () => {
    return function MockQuestionModal({ isOpen, closeModal }) {
        if (!isOpen) return null;
        return (
            <div data-testid="mock-question-modal">
                <button onClick={closeModal}>Close Modal</button>
            </div>
        );
    };
});

describe('GameSummary Component', () => {
    const defaultProps = {
        date: '2025-04-06',
        hour: '14:30',
        correctAnswers: 7,
        wrongAnswers: 3,
        time: 120,
        questions: [
            {
                answers: [
                    { text: 'Answer 1', correct: true, selected: true },
                    { text: 'Answer 2', correct: false, selected: false }
                ]
            }
        ]
    };

    test('renders with all provided props', () => {
        render(<GameSummary {...defaultProps} />);

        expect(screen.getByText('2025-04-06')).toBeInTheDocument();
        expect(screen.getByText('14:30')).toBeInTheDocument();

        expect(screen.getByText('7')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();

        expect(screen.getByText('Total time: 120')).toBeInTheDocument();
        expect(screen.getByText('Time per question: 12.00')).toBeInTheDocument();

        expect(screen.getByText('Check questions')).toBeInTheDocument();
    });

    test('calculates time per question correctly', () => {
        render(<GameSummary {...defaultProps} />);
        expect(screen.getByText('Time per question: 12.00')).toBeInTheDocument();
    });

    test('handles zero questions case for time per question', () => {
        render(
            <GameSummary
                {...defaultProps}
                correctAnswers={0}
                wrongAnswers={0}
            />
        );
        expect(screen.getByText('Time per question: 0.00')).toBeInTheDocument();
    });

    test('opens question modal when button is clicked', () => {
        render(<GameSummary {...defaultProps} />);

        expect(screen.queryByTestId('mock-question-modal')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Check questions'));

        expect(screen.getByTestId('mock-question-modal')).toBeInTheDocument();
    });

    test('closes question modal when close function is called', () => {
        render(<GameSummary {...defaultProps} />);

        fireEvent.click(screen.getByText('Check questions'));
        expect(screen.getByTestId('mock-question-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close Modal'));
        expect(screen.queryByTestId('mock-question-modal')).not.toBeInTheDocument();
    });

    test('passes questions data to the modal', () => {
        const { rerender } = render(<GameSummary {...defaultProps} />);

        const updatedProps = {
            ...defaultProps,
            questions: null
        };

        rerender(<GameSummary {...updatedProps} />);

        expect(screen.getByText('Check questions')).toBeInTheDocument();
    });

    test('handles undefined props gracefully', () => {
        render(<GameSummary date="" hour="" correctAnswers={0} wrongAnswers={0} time={0} questions={[]} />);

        expect(screen.getByText('Total time: 0')).toBeInTheDocument();
        expect(screen.getByText('Time per question: 0.00')).toBeInTheDocument();
    });
});