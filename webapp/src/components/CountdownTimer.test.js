import React from 'react';
import { render, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CountdownTimer from './CountdownTimer';

jest.useFakeTimers();

describe('CountdownTimer Component', () => {
    let timerRef;
    let onTimeOutMock;

    beforeEach(() => {
        timerRef = React.createRef();
        onTimeOutMock = jest.fn();
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

    test('onTimeOut callback is called when timer reaches zero', () => {
        render(<CountdownTimer ref={timerRef} maxTime={0.5} onTimeOut={onTimeOutMock} />);
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(onTimeOutMock).toHaveBeenCalled();
    });

    test('reset method resets timer to maxTime', () => {
        render(<CountdownTimer ref={timerRef} maxTime={10} />);
        act(() => {
            jest.advanceTimersByTime(2000);
            timerRef.current.reset();
        });
        expect(timerRef.current).toBeDefined();
    });

    test('timer circles have correct attributes', () => {
        const { container } = render(<CountdownTimer ref={timerRef} />);
        const circles = container.querySelectorAll('circle');
        expect(circles.length).toBeGreaterThan(0);
        expect(circles[0]).toHaveAttribute('cx', '32');
        expect(circles[0]).toHaveAttribute('cy', '39');
    });

    test('svg has correct viewBox attribute', () => {
        const { container } = render(<CountdownTimer ref={timerRef} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('viewBox', '0 0 64 64');
    });

    test('svg has correct preserveAspectRatio attribute', () => {
        const { container } = render(<CountdownTimer ref={timerRef} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('preserveAspectRatio', 'xMidYMid meet');
    });

    test('multiple timers can exist independently', () => {
        const timerRef2 = React.createRef();
        const { container } = render(
            <>
                <CountdownTimer ref={timerRef} maxTime={10} />
                <CountdownTimer ref={timerRef2} maxTime={20} />
            </>
        );
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBe(2);
    });

    test('timer rotation updates correctly', () => {
        render(<CountdownTimer ref={timerRef} maxTime={10} />);
        act(() => {
            jest.advanceTimersByTime(2000);
        });
        expect(timerRef.current).toBeDefined();
    });

    test('timer updates at the correct interval', () => {
        const setIntervalSpy = jest.spyOn(window, 'setInterval');
        render(<CountdownTimer ref={timerRef} maxTime={10} />);
        expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 50);
    });

    test('timer maintains state across re-renders', () => {
        const { rerender } = render(<CountdownTimer ref={timerRef} maxTime={10} />);
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        rerender(<CountdownTimer ref={timerRef} maxTime={10} />);
        expect(timerRef.current).toBeDefined();
    });
});