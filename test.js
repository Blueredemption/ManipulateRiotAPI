import * as Api from "./riotApiCalls.js";
import * as Constants from "./constants.js";
import { truncate } from "fs";
import { match } from "assert";

function filterUnique(arr) {
  return Array.from(new Set(arr));
}

function sleep(ms) {
  console.log(".");
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getFirstInstanceOf(participants, summoner) {
  let desired = null;
  participants.forEach((participant) => {
    if (participant.puuid == summoner.puuid) {
      desired = participant;
      return;
    }
  });
  return desired; // in no case should this be null
}

async function getMatchIDs(key, puuid, startEpoch, endEpoch, queueID) {
  const secondsInRange = 86400; // 1 day
  let list = [];
  for (let i = startEpoch; i < endEpoch; i += secondsInRange) {
    const returnedObject = JSON.parse(
      await Api.getMatchesInRange(
        key,
        puuid,
        i,
        i + secondsInRange + 7200, // +7200s ie 2hrs for leeway (we check for duplicates dw)
        queueID
      )
    );
    list = [...list, ...returnedObject.values()];
    await sleep(1500); // so we don't speed through our request limit.
  }
  return filterUnique(list);
}

async function getMatches(key, matchIDs) {
  const list = [];
  for (let i = 0; i < matchIDs.length; i++) {
    const returnedObject = JSON.parse(await Api.getMatch(key, matchIDs[i]));
    await sleep(1500);
    list.push(returnedObject);
  }
  return list;
}

// implementation
async function runSequence() {
  // get the API key and username from the txt files
  const key = Constants.getKey();
  const username = Constants.getUserName();
  const seasonStartEpoch = parseInt(Constants.getStartEpoch());
  const seasonEndEpoch = Math.min(
    parseInt(Constants.getEndEpoch()),
    Date.now() / 1000
  );
  const queueID = parseInt(Constants.getQueueID());

  // retreive the basic summoner information
  const summoner = JSON.parse(await Api.getSummonerFromUsername(key, username));

  // for each day between the start and end of a season, retrieve the match history entries and aggregate them into a list
  const matchIDs = await getMatchIDs(
    key,
    summoner.puuid,
    seasonStartEpoch,
    seasonEndEpoch,
    queueID
  );

  // for each match id retrieve aggregate the relevent match data list.
  const matchData = await getMatches(key, matchIDs);

  // custom object to store data
  const releventData = {
    matchData: null,
    playerData: null,
  };

  // list of the custom object
  const releventDataList = [];

  // create an instance of the custom object for each match
  matchData.forEach((match) => {
    const data = Object.create(releventData);
    data.matchData = match;
    data.playerData = getFirstInstanceOf(match.info.participants, summoner);
    releventDataList.push(data);
  });

  // sort the list
  releventDataList.sort((a, b) => {
    return a.matchData.info.gameCreation - b.matchData.info.gameCreation;
  });

  //console.log(releventDataList[0].matchData.info.teams);
  //console.log(releventDataList[0].playerData);

  releventDataList.forEach((releventDataEntry) => {
    printStuff(releventDataEntry);
  });
}

function printStuff(releventData) {
  console.log();
  console.log(
    "Start Date/Time: " + new Date(releventData.matchData.info.gameCreation)
  );
  console.log(
    "Side: " + (releventData.playerData.teamId == 100 ? "Blue" : "Red")
  );
  console.log("Result: " + (releventData.playerData.win ? "Win" : "Loss"));
  console.log("Champion: " + releventData.playerData.championName);
  console.log(
    "Game Duration: " +
      Math.trunc(releventData.matchData.info.gameDuration / 60) +
      "m " +
      (
        (releventData.matchData.info.gameDuration / 60 -
          Math.trunc(releventData.matchData.info.gameDuration / 60)) *
        60
      ).toFixed(0) +
      "s"
  );
  console.log(
    "KDA: " +
      releventData.playerData.kills +
      "/" +
      releventData.playerData.deaths +
      "/" +
      releventData.playerData.assists +
      " " +
      (releventData.playerData.deaths == 0
        ? "Perfect"
        : (
            (releventData.playerData.kills + releventData.playerData.assists) /
            releventData.playerData.deaths
          ).toFixed(2) + ":1")
  );
  console.log(
    "Total Damage to Champions: " +
      releventData.playerData.totalDamageDealtToChampions
  );
  console.log(
    "Total Damage Taken: " + releventData.playerData.totalDamageTaken
  );
  console.log(
    "CS: " +
      (releventData.playerData.totalMinionsKilled + releventData.playerData.neutralMinionsKilled)+
      " (" +
      (
        (releventData.playerData.totalMinionsKilled + releventData.playerData.neutralMinionsKilled) /
        (releventData.matchData.info.gameDuration / 60)
      ).toFixed(2) +
      ")"
  );
  console.log("Vision Score: " + releventData.playerData.visionScore);
}

runSequence();
