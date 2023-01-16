import fs from 'fs';

export function getKey() {
  return readTextFromFile("constants/key.txt");
}

export function getUserName() {
  return readTextFromFile("constants/username.txt");
}

export function getStartEpoch() {
  return readTextFromFile("constants/start.txt");
}

export function getEndEpoch() {
  return readTextFromFile("constants/end.txt");
}

export function getQueueID() {
  return readTextFromFile("constants/queueID.txt");
}

// internal methods
function readTextFromFile(filepath) {
    return fs.readFileSync(filepath, "utf8");
  }
  
