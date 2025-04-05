import React, { useState, useEffect, useCallback, useRef } from 'react';
import "./History.css"
import styles from "./Leaderboard.module.css";
import Nav from "../components/Nav";
import { Autocomplete, Button, TextField } from '@mui/material';
import {GameSummary} from "../components/GameSummary";
import { Scrollbars } from 'react-custom-scrollbars-2';
import axios from "axios";

const Leaderboard = () => {
  const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8000'; //'http://localhost:8004'

  const [statistics, setStatistics] = useState({
    //declaracion default
    userName: "",
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    averageTime: 0,
    bestTime: 0,
    rightAnswers: 0,
    wrongAnswers: 0
  });

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

  // Cargar estadísticas al montar el componente (una sola vez)
  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);
  

  ////////////////////////////////////////////////////////////
  const options = ["React", "Angular", "Vue", "Svelte"];

  const scrollRef = useRef(null);

  //TODO
  //Get los cinco usuarios con mejores Score

  //

  //Get lista usuarios -> Para poner en el Autocomplete
  //Get lista de matches por usuario (para mostrarlos segun el usuario seleccionado en el Autocomplete)


  return (
    <div className={styles.pageContainer}>
      <Nav />
      
      <div className={styles.leaderboardContainer}>

        <div className={styles.rankingsContainer}>
            <div className={styles.scoreRankingSection}>
                <h2 className={styles.rankingTitle}>Score Ranking</h2>
                <div className={styles.rankingItem}>
                    <span className={styles.rankingPosition}>1</span>
                    <span className={styles.rankingUserName}>Usuario 1</span>
                    <span className={styles.rankingScore}>100</span>
                </div>
            </div>

            <div className={styles.numberMatchesRankingSection}>
                <h2 className={styles.rankingTitle}>Most hardworking players</h2>
                <div className={styles.rankingItem}>
                    <span className={styles.rankingPosition}>1</span>
                    <span className={styles.rankingUserName}>Usuario 1</span>
                    <span className={styles.rankingScore}>100</span>
                </div>
            </div>

        </div>

        <div className={styles.globalMatchesContainer}>
          <h1 className={styles.sectionTitle}>Global Matches</h1>
          
          <div className={styles.userMatchesSearchArea}>
                <Autocomplete
                    className={styles.searchInput}
                    options={options}
                    renderInput={(params) => (
                    <TextField {...params} label="Search for a username" variant="outlined" />
                    )}
                />

                <Button variant="contained" color="primary" onClick={() => {}}>
                    Search
                </Button>
           </div> 

          <div className={styles.userFoundMatchesList}>
            <Scrollbars autoHide ref={scrollRef} className={styles.matchesScrollbar} style={{ height: '100%' }}>
              <GameSummary
                gameId={1}
                userName="Usuario 1"
                score={100}
                time={30}
                rightAnswers={5}
                wrongAnswers={2}
              />
              <GameSummary
                gameId={2}
                userName="Usuario 2"
                score={80}
                time={45}
                rightAnswers={4}
                wrongAnswers={3}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
              <GameSummary
                gameId={3}
                userName="Usuario 3"
                score={90}
                time={35}
                rightAnswers={5}
                wrongAnswers={1}
              />
            </Scrollbars>
            
          </div>


        </div>

      </div>
    </div>
  );
};

export default Leaderboard;
