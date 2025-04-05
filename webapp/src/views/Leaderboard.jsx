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

  ////////////////////////////////////////////////////////////
  const [scoreRanking, setScoreRanking] = React.useState([]);
  const [nMatchesRanking, setNMatchesRanking] = React.useState([]);
  const [users, setUsers] = React.useState([]);
  
  const [searchUsername, setSearchUsername] = useState(''); // Estado para el nombre de usuario buscado

  const [games, setGames] = React.useState([]);

  const scrollRef = useRef(null);

  //TODO
  //Get los cinco usuarios con mejores Score

  //

  //Get lista usuarios -> Para poner en el Autocomplete
  //Get lista de matches por usuario (para mostrarlos segun el usuario seleccionado en el Autocomplete)


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
          wrongAnswers: match.wrongAnswers
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
                    options={(users.map(user => user.username) || [])}
                    renderInput={(params) => (
                    <TextField {...params} label="Search for a username" variant="outlined" />
                    )}

                    value={searchUsername}
                    onChange={(event, newValue) => setSearchUsername(newValue)}
                    freeSolo
                />

                <Button variant="contained" color="primary" onClick={handleUsernameSearch} className={styles.searchButton}>
                    Search
                </Button>
           </div> 

          <div className={styles.userFoundMatchesList}>
            <Scrollbars autoHide ref={scrollRef} className={styles.matchesScrollbar} style={{ height: '100%' }}>
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
