import React from "react";
import styles from "./RankingEntry.module.css";

export const RankingEntry = ({ rank, username, statistics }) => {
    return (
        <div className={styles.rankingEntryContainer}>
            <span 
                className={`${styles.rank} ${
                    rank === 1 ? styles.gold : rank === 2 ? styles.silver : rank === 3 ? styles.bronze : ""
                }`}
                >
                {rank}
            </span >
            <span  className={styles.username}>{username}</span >
            <span  className={styles.stat}>{statistics.bestScore}</span >
            <span  className={styles.stat}>{statistics.gamesPlayed}</span >
            <span  className={styles.stat}>{statistics.averageTime}</span >
        </div>

    );
}

export default RankingEntry;