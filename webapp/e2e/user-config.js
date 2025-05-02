const testUser = {
    username: `${Date.now()}`, //para que no se repita
    //password: '123',
    password: 'aA1?', //ajustado a los requisitos de complejidad
    isRegistered: false
};

module.exports = { testUser };