import React, { useState, useEffect, useCallback, useRef } from 'react';
import "./History.css"
import styles from "./Leaderboard.module.css";
import Nav from "../components/Nav";
import { Autocomplete, Button, TextField } from '@mui/material';
import {GameSummary} from "../components/GameSummary";
import { Scrollbars } from 'react-custom-scrollbars-2';
import RankingEntry from '../components/RankingEntry';
import { FaTrophy, FaSearch  } from 'react-icons/fa';
import axios from "axios";

const Leaderboard = () => {
  let apiEndpoint;

  if (window.location.hostname === 'localhost') {
    apiEndpoint = 'http://localhost:8000'; // Para desarrollo
  } else {
    apiEndpoint = 'http://143.47.54.63:8000'; // Para producción
  }

  ////////////////////////////////////////////////////////////
  const [scoreRanking, setScoreRanking] = React.useState([]);
  const [nMatchesRanking, setNMatchesRanking] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  
  const [searchUsername, setSearchUsername] = useState(''); // Estado para el nombre de usuario buscado

  const [games, setGames] = React.useState([]);

  const scrollRef = useRef(null);

  //TODO
  //Get los cinco usuarios con mejores Score

  const fetchScoreRanking = useCallback(async () => {
    try {
      const response = await axios.get(`${apiEndpoint}/scoreRanking`);
      if (response.data) {
        setScoreRanking(response.data);
      }
    } catch (error) {
      console.error("Error fetching score ranking:", error);
    }
  }, [apiEndpoint]);

  //Se carguen al iniciar la pagina
  useEffect(() => {
    fetchScoreRanking();
  }, [fetchScoreRanking]);

  //Get los cinco usuarios con más partidas jugadas
  const fetchNMatchesRanking = useCallback(async () => {
    try {
      const response = await axios.get(`${apiEndpoint}/nMatchesRanking`);
      if (response.data) {
        setNMatchesRanking(response.data);
      }
    } catch (error) {
      console.error("Error fetching number of matches ranking:", error);
    }
  }, [apiEndpoint]);

  //Se carguen al iniciar la pagina
  useEffect(() => {
    fetchNMatchesRanking();
  }, [fetchNMatchesRanking]);

  //

  //Caargar los usuarios en el input de busqueda
  const fetchUsers = useCallback(async () => {
    try {
      // Aquí deberías tener un endpoint que devuelva la lista de usuarios
      // Si no existe, considera crear uno
      const response = await axios.get(`${apiEndpoint}/users`);
      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }, [apiEndpoint]);
  
  //Se carguen al iniciar la pagina
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);


  const handleUsernameSearch = async () => {
    if (!searchUsername) return;
    
    try {
      const response = await axios.get(`${apiEndpoint}/userinfo/matches/${searchUsername}`);
      
      if (response.data && Array.isArray(response.data)) {

        //Solucion TEMPORAL al problema de partidas vacias. UNA VEZ RESUELTO QUITAR ESTE FILTRO
        const validMatches = response.data.filter(match => {
          return match.date && !isNaN(new Date(match.date).getTime());
        });
        
        //const formattedMatches = response.data.map
        const formattedMatches = validMatches.map(match => ({
          id: match.id,
          date: match.date,
          time: match.time,
          score: match.score,
          correctAnswers: match.correctAnswers,
          wrongAnswers: match.wrongAnswers,
          questions: match.questions,

          difficulty: match.difficulty
        }));
        
        setGames(formattedMatches);
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error("Error fetching user matches:", error);
      setGames([]);
    }
  };

  


  return (
    <div className={styles.pageContainer}>
      <Nav />
      
      <div className={styles.leaderboardContainer}>

        <div className={styles.rankingsContainer}>
            <div className={styles.scoreRankingSection}>
                <h2 className={styles.rankingTitle}>Score Ranking</h2>
                
                <div className={styles.rankingHeader}>
                  <span className={styles.headerRank}><FaTrophy/></span>
                  <span className={styles.headerUsername}>Username</span>
                  <span className={styles.headerScore}>Best Score</span>
                  <span className={styles.headerMatches}>Matches</span>
                  <span className={styles.headerTime}>Average Time</span>
                </div>

                {scoreRanking.length > 0 ? (
                scoreRanking.map((user, index) => {
                // Extraer score de forma segura
                return (
                    <RankingEntry
                        key={user._id || index}
                        rank={user.rank}
                        username={user.username}
                        statistics={user.statistics}
                    />
                );
            })
              ) : (
            <div className={styles.noRankingData}>
                <p>No ranking data available</p>
            </div>
              )}

            </div>

            <div className={styles.numberMatchesRankingSection}>
                <h2 className={styles.rankingTitle}>Most Active Players</h2>

                <div className={styles.rankingHeader}>
                  <span className={styles.headerRank}><FaTrophy/></span>
                  <span className={styles.headerUsername}>Username</span>
                  <span className={styles.headerScore}>Best Score</span>
                  <span className={styles.headerMatches}>Matches</span>
                  <span className={styles.headerTime}>Average Time</span>
                </div>

                {nMatchesRanking.length > 0 ? (

                    nMatchesRanking.map((user, index) => {
                        return (
                            <RankingEntry
                                key={user._id || index}
                                rank={user.rank}
                                username={user.username}
                                statistics={user.statistics}
                            />
                        );
                    })
                    ) : (
                    <div className={styles.noRankingData}>
                        <p>No ranking data available</p>
                    </div>
                    )}
            </div>

        </div>

        <div className={styles.globalMatchesContainer}>
          <h1 className={styles.sectionTitle}>Global Matches</h1>
          
          <div className={styles.userMatchesSearchArea}>
                <Autocomplete
                    className={styles.searchInput}
                    options={(users.map(user => user.username) || [])}
                    renderInput={(params) => (
                    <TextField {...params} label="Search for a username" variant="outlined" />
                    )}

                    value={searchUsername}
                    onChange={(event, newValue) => setSearchUsername(newValue)}
                    freeSolo
                />

                <Button variant="contained" color="primary" onClick={handleUsernameSearch} className={styles.searchButton}>
                    Search&nbsp;<FaSearch />
                </Button>
           </div> 

          <div className={styles.userFoundMatchesList}>
            <Scrollbars autoHide ref={scrollRef} className={styles.matchesScrollbar} style={{ height: '100%' }}>
                {games.length > 0 ? (
                    games.map((game, index) => (
                      <div key={game.id || index} className={styles.gameSummaryWrapper}>
                        <GameSummary
                            date={new Date(game.date).toLocaleDateString()}
                            hour={new Date(game.date).toLocaleTimeString()}
                            correctAnswers={game.correctAnswers}
                            wrongAnswers={game.wrongAnswers}
                            time={game.time}
                            questions={game.questions}
                            difficulty={game.difficulty}
                        />
                      </div>
                    ))
                ) : (
                    <div className={styles.noGamesMessage}>
                    <p>There are no matches to display on this page.</p>
                    </div>
                )}
            </Scrollbars>
            
          </div>


        </div>

      </div>
    </div>
  );
};

export default Leaderboard;
