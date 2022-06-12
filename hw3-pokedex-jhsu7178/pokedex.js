/**
 * Name: Jason Hsu
 * Date: 5/14/2020
 * Section: CSE 154 AM
 *
 * This is a .js file linked to pokemon.html that controls the game functionality.
 * It will send GET and POST requests to the pokemon API to simulate a pokedex
 * and pokemon battle.
 */
"use strict";

(function() {

  /** MODULE GLOBAL VARIABLES, CONSTANTS */
  let guid;
  let pid;
  const API_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const IMG_URL = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/";
  const MAX_PERCENT = 100;
  const LOW_PERCENT = 20;
  const OK_STATUS = 200;
  const READY_STATUS = 300;

  /**
   *  Add a function that will be called when the window is loaded.
   */
  window.addEventListener("load", initialize);

  /**
   * Initializes the pokedex with the start button hidden until the player
   * picks a pokemon.
   * Has a button to flee the battle (Auto lose)
   * Has a button to go back to the pokedex after winning/losing the match.
   */
  function initialize() {
    initBoard();
    id("start-btn").addEventListener("click", switchViews);
    id("flee-btn").addEventListener("click", playGame);
    id("endgame").addEventListener("click", switchViews);
  }

  /**
   * Send a GET request to the pokemon API to get all the pokemon in the pokedex.
   * Uses it to fill the pokedex.
   */
  function initBoard() {
    let url = API_URL + "pokedex.php?pokedex=all";
    fetch(url)
      .then(checkStatus)
      .then(createImgs)
      .catch(console.error);
  }

  /**
   * Unhides the pokedex and sends a GET request to the pokemon API
   * to get data on the selected pokemon.
   */
  function createPokeCard() {
    let pokeParam = this.id;
    let url = API_URL + "pokedex.php?pokemon=" + pokeParam;
    fetch(url)
      .then(checkStatus)
      .then(JSON.parse)
      .then(addCard)
      .then(handleStart)
      .catch(console.error);
  }

  /**
   * Used to add the pokemon into the pokedex and GET the pokemon img ids.
   * @param {String} responseData used to create pokemon images.
   */
  function createImgs(responseData) {
    let pokemonName;
    let container = id("pokedex-view");
    let pokemonParse = responseData.split("\n");
    for (let i = 0; i < pokemonParse.length; i++) {
      let nameBreak = pokemonParse[i].split(":");
      pokemonName = nameBreak[1];
      let pokemonPic = document.createElement("img");
      pokemonPic.classList.add("sprite");
      if (pokemonName === "charmander" || pokemonName === "bulbasaur" ||
                                            pokemonName === "squirtle") {
        pokemonPic.classList.add("found");
        pokemonPic.addEventListener("click", createPokeCard);
      }
      pokemonPic.setAttribute("src", IMG_URL + pokemonName + ".png");
      pokemonPic.setAttribute("alt", pokemonName);
      pokemonPic.setAttribute("id", pokemonName);
      container.appendChild(pokemonPic);
    }
  }

  /**
   * Used to add the card to the html when the user clicks on the pokemon
   * @param {JSON} responseData JSON data used to create the images
   */
  function addCard(responseData) {
    let player;
    if (id("pokedex-view").classList.contains("hidden")) {
      player = "#p2 ";
    } else {
      player = "#p1 ";
    }

    qs(player + ".name").textContent = responseData.name;
    qs(player + ".pokemon-pic img").setAttribute("src", API_URL + responseData.images.photo);
    qs(player + ".type").setAttribute("src", API_URL + responseData.images.typeIcon);
    qs(player + ".weakness").setAttribute("src", API_URL + responseData.images.weaknessIcon);
    qs(player + ".hp").textContent = responseData.hp + "HP";
    qs(player + ".info").textContent = responseData.info.description;

    handleAbilities(responseData, player);
  }

  /**
   * Sends a POST request to the pokemon API to initialize the battle
   * Takes params of start game and the user pokemon.
   */
  function preBattleView() {
    let url = API_URL + "game.php";
    let params = new FormData();
    params.append("startgame", "true");
    params.append("mypokemon", qs("#p1 .name").textContent);

    fetch(url, {method: "POST", body: params})
      .then(checkStatus)
      .then(JSON.parse)
      .then(startGame)
      .then(handleStart)
      .catch(console.error);
  }

  /**
   * Used to switch between the battle view and the pokedex view.
   */
  function switchViews() {
    if (this.id === "start-btn") {
      preBattleView();
      qs("h1").textContent = "Pokemon Battle Mode!";
      id("flee-btn").classList.toggle("hidden");
      enableButtons();
    } else if (this.id === "endgame") {
      resetHealth();
      this.classList.toggle("hidden");
      id("start-btn").classList.toggle("hidden");
      qs("h1").textContent = "Your Pokedex";
    }

    id("pokedex-view").classList.toggle("hidden");
    id("p2").classList.toggle("hidden");
    qs("#p1 .hp-info").classList.toggle("hidden");
    id("results-container").classList.toggle("hidden");
  }

  /**
   * Enables the ability buttons when the battle starts.
   */
  function enableButtons() {
    let revealedAbilities = qsa("#p1 .moves button");
    for (let i = 0; i < revealedAbilities.length; i++) {
      if (!revealedAbilities[i].classList.contains("hidden")) {
        revealedAbilities[i].disabled = false;
        revealedAbilities[i].addEventListener("click", playGame);
      }
    }
  }

  /**
   * Used to fill the data of the random enemy pokemon.
   * @param {JSON} responseData JSON data used to grab the game data of the pokemon and ids.
   */
  function startGame(responseData) {
    guid = responseData.guid;
    pid = responseData.pid;
    responseData = responseData["p2"];
    addCard(responseData);
  }

  /**
   * Used to unhide the start buttons at the beginning.
   */
  function handleStart() {
    if (id("start-btn").classList.contains("hidden")) {
      id("start-btn").classList.toggle("hidden");
    }

    if (!id("p2").classList.contains("hidden")) {
      id("start-btn").classList.toggle("hidden");
    }
  }

  /**
   * Sends a POST request to the pokemon API with the move the user used.
   * Also controls the loading gif and when the user wins or loses.
   */
  function playGame() {
    let url = API_URL + "game.php";
    let params = new FormData();
    params.append("guid", guid);
    params.append("pid", pid);
    if (this.id !== "flee-btn") {
      params.append("movename", this.children[0].textContent.toLowerCase().replace(/\s/, ''));
    } else {
      params.append("movename", "flee");
    }
    loadingScreen();

    fetch(url, {method: "POST", body: params})
      .then(checkStatus)
      .then(JSON.parse)
      .then(processTurn)
      .then(loadingScreen)
      .catch(console.error);
  }

  /**
   * Processes the turn and adds what moves were used to the result screen.
   * @param {JSON} responseData JSON used to grab the game data of the pokemon and ids.
   */
  function processTurn(responseData) {
    id("p1-turn-results").textContent = "Player 1 played " + responseData.results["p1-move"] +
                                              " and " + responseData.results["p1-result"] + "!";

    if (responseData.results["p2-move"] !== null) {
      id("p2-turn-results").textContent = "Player 2 played " + responseData.results["p2-move"] +
                                              " and " + responseData.results["p2-result"] + "!";
    }

    if (responseData.results["p2-move"] === null) {
      id("p2-turn-results").textContent = "";
    }
    id("p1-turn-results").classList.remove("hidden");
    id("p2-turn-results").classList.remove("hidden");
    calculateDamage(responseData);
  }

  /**
   * Used to calculate the damage on each turn and change the HP bar displayed.
   * @param {JSON} responseData JSON used to grab the game data of the pokemon and ids.
   */
  function calculateDamage(responseData) {
    let currentHp = responseData.p1["current-hp"];
    let enemyHp = responseData.p2["current-hp"];
    let fullHp = responseData.p1.hp;
    let enemyFull = responseData.p2.hp;
    let yourPercent = currentHp / fullHp * MAX_PERCENT;
    let enemyPercent = enemyHp / enemyFull * MAX_PERCENT;
    qs("#p1 .hp").textContent = currentHp + "HP";
    qs("#p2 .hp").textContent = enemyHp + "HP";
    qs("#p1 .health-bar").style.width = yourPercent + "%";
    qs("#p2 .health-bar").style.width = enemyPercent + "%";
    if (yourPercent <= LOW_PERCENT && !qs("#p1 .health-bar").classList.contains("low-health")) {
      qs("#p1 .health-bar").classList.add("low-health");
    }

    if (enemyPercent <= LOW_PERCENT && !qs("#p2 .health-bar").classList.contains("low-health")) {
      qs("#p2 .health-bar").classList.add("low-health");
    }

    win(responseData);
  }

  /**
   * Controls when the user wins or loses the battle at HP = 0
   * @param {JSON} responseData JSON used to grab the game data of the pokemon and ids.
   */
  function win(responseData) {
    let endGame = false;
    if (responseData.p1["current-hp"] === 0) {
      qs("h1").textContent = "You lost!";
      endGame = true;
    } else if (responseData.p2["current-hp"] === 0) {
      qs("h1").textContent = "You won!";
      endGame = true;
      addFoundPokemon(responseData);
    }

    if (endGame) {
      id("endgame").classList.remove("hidden");
      id("flee-btn").classList.add("hidden");
      let buttons = qsa("#p1 .moves button");
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].disabled = true;
      }
    }
  }

  /**
   * Used to add the enemy pokemon to the pokedex if you win the battle.
   * @param {JSON} responseData used to grab the game data of the pokemon and ids.
   */
  function addFoundPokemon(responseData) {
    let pokedex = qsa("#pokedex-view img");
    for (let i = 0; i < pokedex.length; i++) {
      if (pokedex[i].id === responseData.p2.shortname) {
        pokedex[i].classList.add("found");
        pokedex[i].addEventListener("click", createPokeCard);
      }
    }
  }

  /**
   * Resets the HP bar back to full after the end of the battle.
   */
  function resetHealth() {
    qs("#p1 .health-bar").classList.remove("low-health");
    qs("#p2 .health-bar").classList.remove("low-health");
    qs("#p1 .health-bar").style.width = "100%";
    qs("#p2 .health-bar").style.width = "100%";
  }

  /**
   * Hides and unhides the loading gif.
   */
  function loadingScreen() {
    id("loading").classList.toggle("hidden");
  }

  /**
   * Used to load the abilities of the pokemon cards when clicked.
   * @param {JSON} responseData used to grab the game data of the pokemon and ids.
   * @param {string} player String used to find the id of either p1 or p2
   */
  function handleAbilities(responseData, player) {
    let moves = qsa(player + ".move");
    let buttons = qsa(player + ".moves button");
    let images = qsa(player + ".moves img");
    let dp = qsa(player + ".moves .dp");
    if (moves.length > responseData["moves"].length) {
      for (let i = 0; i < moves.length - responseData["moves"].length; i++) {
        buttons[moves.length - i - 1].classList.add("hidden");
      }
    } else {
      for (let i = 0; i < moves.length; i++) {
        if (buttons[i].classList.contains("hidden")) {
          buttons[i].classList.toggle("hidden");
        }
      }
    }

    for (let i = 0; i < responseData["moves"].length; i++) {
      moves[i].textContent = responseData["moves"][i]["name"];
      images[i].setAttribute("src", API_URL + "icons/" + responseData["moves"][i]["type"] +
                                                                                 ".jpg");
      if (responseData["moves"][i]["dp"]) {
        dp[i].textContent = responseData["moves"][i]["dp"] + " DP";
      } else {
        dp[i].textContent = "";
      }
    }
  }

  /* ------------------------------ Helper Functions  ------------------------------ */
  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} id - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} query - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(query) {
    return document.querySelector(query);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} query - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(query) {
    return document.querySelectorAll(query);
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} response - response to check for success/error
   * @returns {object} - valid result text if response was successful, otherwise rejected
   *                     Promise result
   */
  function checkStatus(response) {
    if (response.status >= OK_STATUS && response.status < READY_STATUS || response.status === 0) {
      return response.text();
    } else {
      return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }
})();
