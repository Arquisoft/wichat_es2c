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

    const renderRankingEntry = (customProps = {}) => {
        const props = { ...defaultProps, ...customProps };
        return render(<RankingEntry {...props} />);
    };

    const testMedalClass = (rank, expectedClass) => {
        const { container } = renderRankingEntry({ rank });
        const rankElement = container.querySelector('.rank');

        if (expectedClass) {
            expect(rankElement).toHaveClass(expectedClass);
        } else {
            expect(rankElement).not.toHaveClass('gold');
            expect(rankElement).not.toHaveClass('silver');
            expect(rankElement).not.toHaveClass('bronze');
        }
    };

    it('renders without crashing', () => {
        renderRankingEntry();
        expect(screen.getByText('testUser')).toBeInTheDocument();
    });

    it('displays rank number, username and statistics correctly', () => {
        renderRankingEntry();

        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('testUser')).toBeInTheDocument();

        expect(screen.getByText('1000')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('2:30')).toBeInTheDocument();
    });

    describe('Medal Classes', () => {
        it('applies gold class for rank 1', () => {
            testMedalClass(1, 'gold');
        });

        it('applies silver class for rank 2', () => {
            testMedalClass(2, 'silver');
        });

        it('applies bronze class for rank 3', () => {
            testMedalClass(3, 'bronze');
        });

        it('does not apply medal classes for ranks > 3', () => {
            testMedalClass(4, null);
        });
    });

    it('handles changes in props correctly', () => {
        const { rerender } = renderRankingEntry();

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