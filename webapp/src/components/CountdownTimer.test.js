import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CountdownTimer from './CountdownTimer';

jest.useFakeTimers();

describe('CountdownTimer Component', () => {
    let timerRef;

    beforeEach(() => {
        timerRef = React.createRef();
        jest.clearAllTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders with default props', () => {
        const { container } = render(<CountdownTimer ref={timerRef} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('initializes with maxTime value', () => {
        const maxTime = 30;
        render(<CountdownTimer ref={timerRef} maxTime={maxTime} />);
        expect(timerRef.current).toBeDefined();
    });

    test('timer decreases over time', () => {
        render(<CountdownTimer ref={timerRef} maxTime={10} />);
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(timerRef.current).toBeDefined();
    });


    test('addTime method increases time left', () => {
        const { container } = render(<CountdownTimer ref={timerRef} maxTime={10} />);
        act(() => {
            jest.advanceTimersByTime(2000);
        });
        act(() => {
            timerRef.current.addTime(3);
        });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('addTime method does not exceed maxTime', () => {
        const maxTime = 10;
        const { container } = render(<CountdownTimer ref={timerRef} maxTime={maxTime} />);
        act(() => {
            timerRef.current.addTime(5);
        });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('restTime method decreases time left', () => {
        const { container } = render(<CountdownTimer ref={timerRef} maxTime={10} />);
        act(() => {
            timerRef.current.restTime(2);
        });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('restTime method does not go below zero', () => {
        const { container } = render(<CountdownTimer ref={timerRef} maxTime={5} />);
        act(() => {
            timerRef.current.restTime(10);
        });
        expect(container.querySelector('svg')).toBeInTheDocument();
    });



    test('cleans up interval on unmount', () => {
        const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
        const { unmount } = render(<CountdownTimer ref={timerRef} />);
        unmount();
        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    test('updates on maxTime prop change', () => {
        const { rerender, container } = render(<CountdownTimer ref={timerRef} maxTime={10} />);
        rerender(<CountdownTimer ref={timerRef} maxTime={20} />);
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    test('custom size prop is applied', () => {
        const customSize = 200;
        const { container } = render(<CountdownTimer ref={timerRef} size={customSize} />);
        const svgElement = container.querySelector('svg');
        expect(svgElement).toHaveAttribute('width', customSize.toString());
        expect(svgElement).toHaveAttribute('height', customSize.toString());
    });
});
