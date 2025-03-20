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

  /*
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
  */

  const [statistics, setStatistics] = useState({
    userName: "Default",
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    averageTime: "0h 0m",
    bestTime: "0h 0m",
    rightAnswers: 0,
    wrongAnswers: 0,
  });

  /*
  const games = [
    { date: "2021-10-10", hour: "10:00", correctAnswers: 10, wrongAnswers: 5, time: 10 },
    { date: "pipom", hour: "10:00", correctAnswers: 10, wrongAnswers: 5, time: 10 },
    { date: "papom", hour: "10:00", correctAnswers: 10, wrongAnswers: 5, time: 10 }
  ];
  */

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
        const response = await axios.get(`${apiEndpoint}/userMatches`, {  //AQUI PROBLEMA
          params: { username }
        });
        
        console.log("Historial del usuario:", response.data);
        console.log("Partidas del usuario:", response.data.matches);

        if (response.data && response.data.matches) {
          setGames(response.data.matches); //CARGO EN GAMES (lo devuelto en json por la peticion), para luego salgan en la lista paginable
          
          //Saco, aparte de los juegos, las estadísticas generales en base a estos
          const gamesPlayed = response.data.matches.length;
          const totalRightAnswers = response.data.matches.reduce((sum, match) => sum + match.correctAnswers, 0);
          const totalWrongAnswers = response.data.matches.reduce((sum, match) => sum + match.wrongAnswers, 0);
          const allScores = response.data.matches.map(match => match.score).filter(score => score !== undefined);
          const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0;
          
          //tiempos del jugador
          const validTimes = response.data.matches.map(match => match.time).filter(time => time !== undefined && time > 0);
          const totalTime = validTimes.reduce((sum, time) => sum + time, 0);
          const averageTime = validTimes.length > 0 ? totalTime / validTimes.length : 0;
          const bestTime = validTimes.length > 0 ? Math.min(...validTimes) : 0;
          
          setStatistics({ //Y finalmente las establezco. Las generales, las que salen en la parte de arriba
            userName: username,
            gamesPlayed,
            averageScore: gamesPlayed > 0 ? Math.round(totalRightAnswers / gamesPlayed) : 0,
            bestScore,
            averageTime: formatTime(averageTime),
            bestTime: formatTime(bestTime),
            rightAnswers: totalRightAnswers,
            wrongAnswers: totalWrongAnswers
          });
        }
      } catch (err) {
        console.error("Error al obtener el historial:", err);
        setError("Error al cargar el historial");
      }
    };

    fetchUserHistory(); //la llamada para obtener todo
  }, [apiEndpoint]);  

  const formatTime = (seconds) => {  //funcion extra para pasar de segundos a horas y minutos, cuestion de presentacion
    if (!seconds || seconds <= 0) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };


  const totalAnswers = statistics.rightAnswers + statistics.wrongAnswers;
  const correctPercentage = Math.round(
    (statistics.rightAnswers / totalAnswers) * 100
  );


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
