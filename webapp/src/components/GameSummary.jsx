import React, { useState } from "react";
import styles from "./GameSummary.module.css";
import QuestionModal from "./Questions"; // Importa el modal

export const GameSummary = ({ date, hour, correctAnswers, wrongAnswers, time, questions, difficulty }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

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


            <div className={styles.difficultyElement}>
                <h3 className={styles.difficultyLabel}>
                    <span className={`${styles.difficultyValue} ${
                    difficulty === 2 ? styles.hardDifficulty : styles.normalDifficulty
                    }`}>
                    {difficulty === 2 ? 'Hard' : 'Normal'}
                    </span>
                </h3>
            </div>


            <div className={styles.TimesElement}>
                <h3 className={styles.totalTime}>Total time: {time}</h3>
                <h3 className={styles.timePerQuestion}>Time per question: {timePerQuestion}</h3>
            </div>


            <div className={styles.QuestionButtonElement}>
                <button className={styles.questionButton} onClick={openModal}>
                    Check questions
                </button>
            </div>

            {/* Aquí pasas las preguntas de manera correcta */}
            <QuestionModal isOpen={isModalOpen} closeModal={closeModal} questions={questions} />

            
        </div>
    );

};
export default GameSummary;