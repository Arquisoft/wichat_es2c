import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionModal from './Questions';
import '@testing-library/jest-dom';

describe('QuestionModal', () => {
    const mockQuestions = [
        {
            id: 1,
            text: 'What is React?',
            answers: [
                { id: 1, text: 'A JavaScript library', correct: true, selected: false },
                { id: 2, text: 'A programming language', correct: false, selected: true },
                { id: 3, text: 'A database', correct: false, selected: false },
            ]
        },
        {
            id: 2,
            text: 'What hook is used for state in React?',
            answers: [
                { id: 1, text: 'useEffect', correct: false, selected: false },
                { id: 2, text: 'useState', correct: true, selected: true },
                { id: 3, text: 'useContext', correct: false, selected: false },
            ]
        }
    ];

    const mockCloseModal = jest.fn();

    test('should not render when isOpen is false', () => {
        render(
            <QuestionModal
                isOpen={false}
                closeModal={mockCloseModal}
                questions={mockQuestions}
            />
        );

        const modalElement = screen.queryByText('Questions:');
        expect(modalElement).not.toBeInTheDocument();
    });

    test('should render when isOpen is true', () => {
        render(
            <QuestionModal
                isOpen={true}
                closeModal={mockCloseModal}
                questions={mockQuestions}
            />
        );

        const modalElement = screen.getByText('Questions:');
        expect(modalElement).toBeInTheDocument();
    });

    test('should display all questions and answers', () => {
        render(
            <QuestionModal
                isOpen={true}
                closeModal={mockCloseModal}
                questions={mockQuestions}
            />
        );

        expect(screen.getByText('Question 1:')).toBeInTheDocument();
        expect(screen.getByText('Question 2:')).toBeInTheDocument();

        expect(screen.getByText('A JavaScript library')).toBeInTheDocument();
        expect(screen.getByText('A programming language')).toBeInTheDocument();
        expect(screen.getByText('A database')).toBeInTheDocument();
        expect(screen.getByText('useEffect')).toBeInTheDocument();
        expect(screen.getByText('useState')).toBeInTheDocument();
        expect(screen.getByText('useContext')).toBeInTheDocument();
    });

    test('should display "There are no questions" when questions array is empty', () => {
        render(
            <QuestionModal
                isOpen={true}
                closeModal={mockCloseModal}
                questions={[]}
            />
        );

        expect(screen.getByText('There are no questions')).toBeInTheDocument();
    });

    test('should call closeModal when Close button is clicked', () => {
        render(
            <QuestionModal
                isOpen={true}
                closeModal={mockCloseModal}
                questions={mockQuestions}
            />
        );

        const closeButton = screen.getByText('Close');
        fireEvent.click(closeButton);

        expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });

    test('should call closeModal when overlay is clicked', () => {
        render(
            <QuestionModal
                isOpen={true}
                closeModal={mockCloseModal}
                questions={mockQuestions}
            />
        );

        const overlay = document.querySelector('.modalOverlay');
        fireEvent.click(overlay);

        expect(mockCloseModal).toHaveBeenCalledTimes(1);
    });

    test('should not call closeModal when content area is clicked', () => {
        render(
            <QuestionModal
                isOpen={true}
                closeModal={mockCloseModal}
                questions={mockQuestions}
            />
        );

        const modalContent = document.querySelector('.modalContent');
        fireEvent.click(modalContent);

        expect(mockCloseModal).not.toHaveBeenCalled();
    });

    test('should apply correct styling for correct and selected answers', () => {
        const { container } = render(
            <QuestionModal
                isOpen={true}
                closeModal={mockCloseModal}
                questions={mockQuestions}
            />
        );


        const answerItems = container.querySelectorAll('.answerItem');

        expect(answerItems.length).toBe(6);

        const correctSelectedAnswer = screen.getByText('useState').closest('li');
        expect(correctSelectedAnswer).toHaveStyle('backgroundColor: #1fff71');

        const incorrectSelectedAnswer = screen.getByText('A programming language').closest('li');
        expect(incorrectSelectedAnswer).toHaveStyle('backgroundColor: #db3535');

        const correctUnselectedAnswer = screen.getByText('A JavaScript library').closest('li');
        expect(correctUnselectedAnswer).toHaveStyle('border: 2px solid green');
        expect(correctUnselectedAnswer).toHaveStyle('backgroundColor: transparent');
    });

    test('should handle null questions prop', () => {
        render(
            <QuestionModal
                isOpen={true}
                closeModal={mockCloseModal}
                questions={null}
            />
        );

        expect(screen.getByText('There are no questions')).toBeInTheDocument();
    });
});