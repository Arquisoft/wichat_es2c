import React from "react";
import "./History.css"
import styles from "./History.module.css";
import Nav from "../components/Nav";
import { PieChart } from "@mui/x-charts/PieChart";

const History = () => {
  const statistics = {
    userName: "🔥😈😈😈 CHUPETE 😈😈😈🔥",
    gamesPlayed: 15,
    averageScore: 88,
    bestScore: 98,
    averageTime: "4h 23m",
    bestTime: "1000h 00m",
    rightAnswers: 300,
    wrongAnswers: 1000,
  };

  const totalAnswers = statistics.rightAnswers + statistics.wrongAnswers;
  const correctPercentage = Math.round(
    (statistics.rightAnswers / totalAnswers) * 100
  );

  return (
    <>
      <Nav />

      <div className={styles.mainContainer}>
        <h1 className={styles.sectionTitle}>Statistics</h1>
        <div className={styles.statisticsContainer}>
          <h2 className={styles.scItem1}>CHUPETE 😈😈🔥</h2>
          <h2 className={styles.scItem2}>Games played: 15</h2>

          <div className={styles.scItem3}>
            <div className={styles.pieChartTitle}>
              <PieChart
                series={[
                  {
                    data: [
                      {
                        value: statistics.rightAnswers,
                        label: "Acertadas",
                        color: "#1fff71",
                      },
                      {
                        value: statistics.wrongAnswers,
                        label: "Falladas",
                        color: "#db3535",
                      },
                    ],
                    innerRadius: 65,
                    outerRadius: 100,
                    paddingAngle: 2,
                    cornerRadius: 5,
                    cx: 100,
                    cy: 100,
                  },
                ]}
                
                width={200}
                height={200}
                margin={{ top: 0, right: 0, bottom: 0, left: 0 }} // Eliminar todos los márgenes
                slots={{ legend: () => null }} // Eliminar la leyenda
                children={
                  <text
                    x={100} // Debe coincidir con cx
                    y={100} // Debe coincidir con cy
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontSize: "30px",
                      fontWeight: "bold",
                      fill: "#000",
                    }}
                  >
                    {correctPercentage}%
                  </text>
                }
              />
            </div>
            <div className={styles.answersContainer}>
              <p>Right Answers: {statistics.rightAnswers}</p>
              <p>Wrong Answers: {statistics.wrongAnswers}</p>
            </div>
          </div>

          <div className={styles.scItem4}>
            <p>Best Score: {statistics.bestScore}</p>
            <p>Average Score: {statistics.averageScore}</p>

            <p>Best Time: {statistics.bestTime}</p>
            <p>Average Time: {statistics.averageTime}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default History;
