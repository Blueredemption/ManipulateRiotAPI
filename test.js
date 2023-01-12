// utility functions (probably created woth ChatGPT lol)

function readTextFromFile(filepath) {
  const fs = require("fs");
  return fs.readFileSync(filepath, "utf8");
}

function queryAPI(url) {
  const https = require("https");
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

function filterUnique(arr) {
  return Array.from(new Set(arr));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// functions actually created by me to play with the riot api information
function getKey() {
  return readTextFromFile("key.txt");
}

function getUserName() {
  return readTextFromFile("username.txt");
}

function getStartEpoch() {
  return readTextFromFile("start.txt");
}

function getEndEpoch() {
  return readTextFromFile("end.txt");
}

function getQueueID() {
  return readTextFromFile("queueID.txt");
}

function getSummonerFromUsername(key, username) {
  const url =
    "https://na1.api.riotgames.com/lol/summoner/v4/summoners/by-name/" +
    username +
    "?api_key=" +
    key;

  return queryAPI(url);
}

function getMatchesInRange(key, puuid, startEpoch, endEpoch, queueID) {
  const url =
    "https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/" +
    puuid +
    "/ids?startTime=" +
    startEpoch +
    "&endTime=" +
    endEpoch +
    "&queue=" +
    queueID +
    "&type=ranked&start=0&count=100&api_key=" +
    key;

  return queryAPI(url);
}

async function getMatches(key, puuid, startEpoch, endEpoch, queueID) {
  const secondsInRange = 86400; // 1 day
  let list = [];
  let counter = 0;
  for (let i = startEpoch; i < endEpoch; i += secondsInRange) {
    returnedObject = JSON.parse(
      await getMatchesInRange(
        key,
        puuid,
        i,
        i + secondsInRange + 7200, // +7200s ie 2hrs for leeway (we check for duplicates dw)
        queueID
      )
    );
    list = [...list, ...returnedObject.values()];
    console.log(
      "Day " + ++counter + " Collected!" + " List Length: " + list.length +", " +returnedObject.values().length +" New"
    );
    await sleep(1500); // so we don't speed through our request limit.
  }
  console.log(list.length);
  list = filterUnique(list);
  console.log(list.length);
  return list;
}

// implementation
async function runSequence() {
  // get the API key and username from the txt files
  const key = getKey();
  const username = getUserName();
  const seasonStartEpoch = parseInt(getStartEpoch());
  const seasonEndEpoch = parseInt(getEndEpoch());
  const queueID = parseInt(getQueueID());

  // retreive the basic summoner information
  const summoner = JSON.parse(await getSummonerFromUsername(key, username));

  // for each day between the start and end of a season, retrieve the match history entries and aggregate them into a list
  const matchIDs = await getMatches(
    key,
    summoner.puuid,
    seasonStartEpoch,
    seasonEndEpoch,
    queueID
  );

  console.log(matchIDs);
  console.log(matchIDs.length);
}

runSequence();
