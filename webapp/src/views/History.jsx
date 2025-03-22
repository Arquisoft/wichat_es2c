import React, { useState, useEffect, useCallback } from 'react';
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
    //declaracion default
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 5;

  //cargar SOLO las estadísticas (solo se llama una vez)
  const fetchStatistics = useCallback(async () => {
    const username = localStorage.getItem("username");
    if (!username) {
      console.error("Usuario no autenticado");
      return;
    }
    
    try {
      const response = await axios.get(`${apiEndpoint}/userStatistics`, {
        params: { username }
      });
      
      if (response.data && response.data.statistics) {
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
    } catch (err) {
      console.error("Error al obtener estadísticas:", err);
    }
  }, [apiEndpoint]);

  //cargar los partidos de la pagina actual
  const fetchPageData = useCallback(async (pageNumber) => {
    const username = localStorage.getItem("username");
    if (!username) {
      return;
    }
    
    try {
      const response = await axios.get(`${apiEndpoint}/userMatches`, {
        params: { 
          username,
          page: pageNumber,
          limit: itemsPerPage
        }
      });
      
      if (response.data) {
        if (response.data.matches) {
          setGames(response.data.matches);
        }
        
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages);
        }
      }
      
    } catch (err) {
      console.error("Error al obtener partidas:", err);
    }
  }, [apiEndpoint, itemsPerPage]);

  // Cargar estadísticas al montar el componente (una sola vez)
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Cargar partidas cuando cambia la página
  useEffect(() => {
    fetchPageData(page);
  }, [page, fetchPageData]);


  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  const totalAnswers = statistics.rightAnswers + statistics.wrongAnswers;
  const correctPercentage = totalAnswers > 0 
    ? Math.round((statistics.rightAnswers / totalAnswers) * 100)
    : 0;


  //const [page, setPage] = React.useState(1);
  //const itemsPerPage = 5;
  //const numPages = Math.ceil(games.length / itemsPerPage);

  //const indexOfLastItem = page * itemsPerPage;
  //const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  //const gamesCurrentPage = games.slice(indexOfFirstItem, indexOfLastItem);



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
              {games.length > 0 ? (
                games.map((game, index) => (
                  <GameSummary
                    key={game.id || index}
                    date={new Date(game.date).toLocaleDateString()}
                    hour={new Date(game.date).toLocaleTimeString()}
                    correctAnswers={game.correctAnswers}
                    wrongAnswers={game.wrongAnswers}
                    time={game.time}
                  />
                ))
              ) : (
                <div className={styles.noGamesMessage}>
                  <p>No hay partidas para mostrar en esta página</p>
                </div>
              )}
        </div>

        <div className={styles.divider}></div>

        <div className={styles.paginationContainer}>
          <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" className={styles.pagination}/>
        </div>

      </div>
    </>
  );
};

export default History;
