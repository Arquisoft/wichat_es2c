import React from "react";
import styles from "./Questions.module.css"; // Asegúrate de crear este archivo CSS

const QuestionModal = ({ isOpen, closeModal, questions }) => {
    if (!isOpen) return null;

    return (
        <div
            className={styles.modalOverlay}
            onClick={closeModal}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    closeModal();
                }
            }}
            role="button"
            tabIndex={0}
        >
            <div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                    }
                }}
            >
                <h2>Questions:</h2>

                {questions && questions.length > 0 ? (
                    <ul className={styles.questionList}>
                        {questions.map((question, index) => (
                            <li key={index} className={styles.questionItem}>
                                <strong>Question {index + 1}:</strong>

                                {/* Mostrar respuestas con estilo condicional */}
                                <ul className={styles.answerList}>
                                    {question.answers.map((answer, idx) => (
                                        <li
                                            key={idx}
                                            className={styles.answerItem}
                                            style={{
                                                border: answer.correct ? '2px solid green' : '2px solid #ccc',
                                                padding: '10px',
                                                margin: '5px 0',
                                                borderRadius: '5px',
                                                backgroundColor: answer.selected ? (answer.correct ? '#1fff71' : '#db3535') : 'transparent',
                                            }}
                                        >
                                            {answer.text}
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>There are no questions</p>
                )}

                <button
                    className={styles.closeButton}
                    onClick={closeModal}
                    accessKey="c"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default QuestionModal;