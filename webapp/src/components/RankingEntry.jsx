import React from "react";
import styles from "./RankingEntry.module.css";

export const RankingEntry = ({ rank, username, statistics }) => {
    return (
        <div className={styles.rankingEntryContainer}>
            <p
                className={`${styles.rank} ${
                    rank === 1 ? styles.gold : rank === 2 ? styles.silver : rank === 3 ? styles.bronze : ""
                }`}
                >
                {rank}
            </p>
            <p className={styles.username}>{username}</p>
            <p className={styles.stat}>{statistics.bestScore}</p>
            <p className={styles.stat}>{statistics.gamesPlayed}</p>
            <p className={styles.stat}>{statistics.averageTime}</p>
        </div>

    );
}

export default RankingEntry;