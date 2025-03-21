import React, { useState, useEffect } from 'react';
import "./History.css"
import styles from "./History.module.css";
import Nav from "../components/Nav";
import { PieChart } from "@mui/x-charts/PieChart";
import {GameSummary} from "../components/GameSummary";

import Pagination from '@mui/material/Pagination';

import axios from "axios";

const History = () => {
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000'; //'http://localhost:8004'

  const [statistics, setStatistics] = useState({
    userName: "",
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    averageTime: "0h 0m",
    bestTime: "0h 0m",
    rightAnswers: 0,
    wrongAnswers: 0
  });

  const [games, setGames] = React.useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //Cargo los datos (partidas del usuario, e info de estas)
  useEffect(() => {
    const fetchUserHistory = async () => {
      const username = localStorage.getItem("username");
      if (!username) {
        setError("Usuario no autenticado");
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`${apiEndpoint}/userMatches`, {
          params: { username }
        });
        
        if (response.data) {

          // Obtener las partidas
          if (response.data.matches) {
            setGames(response.data.matches);
          }
          // Obtener las estadísticas
          if (response.data.statistics) {
            setStatistics({
              userName: username,
              gamesPlayed: response.data.statistics.gamesPlayed,
              averageScore: response.data.statistics.averageScore,
              bestScore: response.data.statistics.bestScore,
              averageTime: response.data.statistics.averageTime,
              bestTime: response.data.statistics.bestTime,
              rightAnswers: response.data.statistics.rightAnswers,
              wrongAnswers: response.data.statistics.wrongAnswers
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error al obtener el historial:", err);
        setError("Error al cargar el historial");
        setLoading(false);
      }
    };
  
    fetchUserHistory(); // la llamada para obtener todo
  }, [apiEndpoint]); 


  const totalAnswers = statistics.rightAnswers + statistics.wrongAnswers;
  const correctPercentage = totalAnswers > 0 
    ? Math.round((statistics.rightAnswers / totalAnswers) * 100)
    : 0;


  const [page, setPage] = React.useState(1);
  const itemsPerPage = 5;

  const numPages = Math.ceil(games.length / itemsPerPage);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const gamesCurrentPage = games.slice(indexOfFirstItem, indexOfLastItem);



  return (
    <>
      <Nav />

      <div className={styles.mainContainer}>
        <h1 className={styles.sectionTitle}>Statistics</h1>

        <div className={styles.divider}></div>

        <div className={styles.statisticsContainer}>
          <h2 className={styles.scItem1}>{statistics.userName}</h2>
          <h2 className={styles.scItem2}>Games played: {statistics.gamesPlayed}</h2>

          <div className={styles.scItem3}>
            <div className={styles.pieChartTitle}>
              <PieChart
                series={[
                  {
                    data: [
                      {
                        value: statistics.rightAnswers,
                        label: "Right answers",
                        color: "#1fff71",
                      },
                      {
                        value: statistics.wrongAnswers,
                        label: "Wrong answers",
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

        <div className={styles.divider}></div>

        <div className={styles.gamesHistoryContainer}>
          {gamesCurrentPage.map((game, index) => (
            <GameSummary
              key={index}
              //date={game.date}
              //hour={game.hour}
              date={new Date(game.date).toLocaleDateString()}
              hour={new Date(game.date).toLocaleTimeString()}
              correctAnswers={game.correctAnswers}
              wrongAnswers={game.wrongAnswers}
              time={game.time}
            />
          ))}
        </div>

        <div className={styles.divider}></div>

        <div className={styles.paginationContainer}>
          <Pagination count={numPages} page={page} onChange={handlePageChange} color="primary" className={styles.pagination}/>
        </div>

      </div>
    </>
  );
};

export default History;
