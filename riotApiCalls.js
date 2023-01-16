import https from "https";

export function getSummonerFromUsername(key, username) {
  const url =
    "https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/" +
    username +
    "?api_key=" +
    key;

  return queryAPI(url);
}

export function getMatchesInRange(key, puuid, startEpoch, endEpoch, queueID) {
  const url =
    "https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/" +
    puuid +
    "/ids?startTime=" +
    startEpoch +
    "&endTime=" +
    endEpoch +
    //"&queue=" +
    //queueID +
    //"&type=ranked" +
    "&start=0&count=100&api_key=" +
    key;

  return queryAPI(url);
}

export function getMatch(key, matchID) {
  const url =
    "https://americas.api.riotgames.com/lol/match/v5/matches/" +
    matchID +
    "?api_key=" +
    key;

  return queryAPI(url);
}

// internal methods
function queryAPI(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve(data);
      });

      res.on("error", (err) => {
        reject(err);
      });
    });
  });
}
