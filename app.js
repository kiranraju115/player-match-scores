const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log("DB Error: ${e.message}");
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDBObjAPI1 = (db1) => {
  return {
    playerId: db1.player_id,
    playerName: db1.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getListOfPlayerDetailsQuery = `
    select
     *
     from player_details 
     order by player_id;
    `;
  const playerDetailsResponse = await db.all(getListOfPlayerDetailsQuery);
  response.send(
    playerDetailsResponse.map((eachPlayer) => convertDBObjAPI1(eachPlayer))
  );
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailQuery = `
    select * from player_details
    where player_id = ${playerId};
    `;
  const playerDetailsResponse = await db.get(getPlayerDetailQuery);
  response.send(convertDBObjAPI1(playerDetailsResponse));
});
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerNameQuery = `
    update player_details 
    set player_name = '${playerName}'
    where player_id = ${playerId}; 
    `;
  await db.run(updatePlayerNameQuery);
  response.send("Player Details Updated");
});

const convertDbObjectAPI4 = (db4) => {
  return {
    matchId: db4.match_id,
    match: db4.match,
    year: db4.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailQuery = `
    select * from match_details where match_id = ${matchId};
    `;
  const matchDetailsResponse = await db.get(getMatchDetailQuery);

  response.send(convertDbObjectAPI4(matchDetailsResponse));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesOfPlayerQuery = `
    select match_details.match_id as matchId,
     match_details.match as match,
     match_details.year as year
     from match_details 
     inner join player_match_score 
     on match_details.match_id = player_match_score.match_id 
     where player_match_score.player_id = ${playerId};
    `;
  const getMatchResponse = await db.all(getAllMatchesOfPlayerQuery);
  response.send(getMatchResponse);
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsOfPlayersQuery = `
    select 
    player_details.player_id as playerId,
    player_details.player_name as playerName
    from player_details 
    inner join player_match_score 
    on player_details.player_id = player_match_score.player_id
    where player_match_score.match_id = ${matchId};
    `;
  const playerDbResponse = await db.all(getMatchDetailsOfPlayersQuery);
  response.send(playerDbResponse);
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getOverviewOfMatchesOfPlayersQuery = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};`;
  const allDbResponse = await db.all(getOverviewOfMatchesOfPlayersQuery);
  response.send(allDbResponse);
});

module.exports = app;
