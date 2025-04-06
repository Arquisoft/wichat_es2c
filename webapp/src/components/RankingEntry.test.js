import React from 'react';
import { render, screen } from '@testing-library/react';
import { RankingEntry } from './RankingEntry';

jest.mock('./RankingEntry.module.css', () => ({
    rankingEntryContainer: 'rankingEntryContainer',
    rank: 'rank',
    username: 'username',
    stat: 'stat',
    gold: 'gold',
    silver: 'silver',
    bronze: 'bronze'
}));

describe('RankingEntry Component', () => {
    const defaultProps = {
        rank: 4,
        username: 'testUser',
        statistics: {
            bestScore: 1000,
            gamesPlayed: 42,
            averageTime: '2:30'
        }
    };

    it('renders without crashing', () => {
        render(<RankingEntry {...defaultProps} />);
        expect(screen.getByText('testUser')).toBeInTheDocument();
    });

    it('displays rank number correctly', () => {
        render(<RankingEntry {...defaultProps} />);
        expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('displays username correctly', () => {
        render(<RankingEntry {...defaultProps} />);
        expect(screen.getByText('testUser')).toBeInTheDocument();
    });

    it('displays statistics correctly', () => {
        render(<RankingEntry {...defaultProps} />);
        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('2:30')).toBeInTheDocument();
    });

    it('applies gold class for rank 1', () => {
        const { container } = render(<RankingEntry {...defaultProps} rank={1} />);
        const rankElement = container.querySelector('.rank');
        expect(rankElement).toHaveClass('gold');
    });

    it('applies silver class for rank 2', () => {
        const { container } = render(<RankingEntry {...defaultProps} rank={2} />);
        const rankElement = container.querySelector('.rank');
        expect(rankElement).toHaveClass('silver');
    });

    it('applies bronze class for rank 3', () => {
        const { container } = render(<RankingEntry {...defaultProps} rank={3} />);
        const rankElement = container.querySelector('.rank');
        expect(rankElement).toHaveClass('bronze');
    });

    it('does not apply medal classes for ranks > 3', () => {
        const { container } = render(<RankingEntry {...defaultProps} rank={4} />);
        const rankElement = container.querySelector('.rank');
        expect(rankElement).not.toHaveClass('gold');
        expect(rankElement).not.toHaveClass('silver');
        expect(rankElement).not.toHaveClass('bronze');
    });

    it('handles changes in props correctly', () => {
        const { rerender } = render(<RankingEntry {...defaultProps} />);

        expect(screen.getByText('testUser')).toBeInTheDocument();
        expect(screen.getByText('4')).toBeInTheDocument();

        const newProps = {
            rank: 1,
            username: 'championUser',
            statistics: {
                bestScore: 9999,
                gamesPlayed: 100,
                averageTime: '1:45'
            }
        };

        rerender(<RankingEntry {...newProps} />);

        expect(screen.getByText('championUser')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('9999')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
        expect(screen.getByText('1:45')).toBeInTheDocument();
    });
});