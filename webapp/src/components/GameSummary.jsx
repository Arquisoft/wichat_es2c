import React from "react";
import styles from "./GameSummary.module.css";


export const GameSummary = ({ date, hour, correctAnswers, wrongAnswers, time }) => {

    const timePerQuestion = (correctAnswers + wrongAnswers) > 0 
        ? (time / (correctAnswers + wrongAnswers)).toFixed(2) 
        : "0.00";

    return (
        <div className={styles.gameSummaryContainer}>
            <div className={styles.dateANDhourElement}>
                <h3 className={styles.dateElement}>{date}</h3>
                <h3 className={styles.hourElement}>{hour}</h3>
            </div>

            <div className={styles.answersElement}>
                <h3 className={styles.correctAnswersElement}>{correctAnswers}</h3>
                <span className={styles.answersSeparator}>/</span>
                <h3 className={styles.wrongAnswersElement}>{wrongAnswers}</h3>
            </div>

            <div className={styles.TimesElement}>
                <h3 className={styles.totalTime}>Total time: {time}</h3>
                <h3 className={styles.timePerQuestion}>Time per question: {timePerQuestion}</h3>
            </div>

            <div className={styles.QuestionButtonElement}>
                <button className={styles.questionButton}>Check questions</button>
            </div>

        </div>
    );

};

export default GameSummary;