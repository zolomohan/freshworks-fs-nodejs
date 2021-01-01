var fs = require("fs");
const readline = require("readline");
const { v4: uuidv4 } = require("uuid");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let lockFileLocation = null;

async function main() {
  let fileLocation = await input("Enter File Location (Leave it empty to create in D:/fs-files): ");

  // If File Location is Not Given,
  if (!fileLocation) {
    // Set File Location
    fileLocation = `D:/fs-files/${uuidv4()}.txt`;

    // If fs-files directory doesn't exist, create the directory.
    if (!fs.existsSync("D:/fs-files")) fs.mkdirSync("D:/fs-files");
  }

  // Create file if it does not exist
  if (!fs.existsSync(fileLocation)) createFile(fileLocation);

  // Check for File size, If its more than 1GB, Stop the process.
  let stats = fs.statSync(fileLocation);
  if (stats.size > 1024 * 1000000) {
    console.log("File Size is Greater than 1GB");
    rl.close();
  }

  // Generate Lock File Location, by removing file extention and adding the .lock extention to the name,
  lockFileLocation = fileLocation.split(".")[0] + ".lock";

  // Check for a lock file, if exists, stop process.
  if (fs.existsSync(lockFileLocation)) {
    console.log("This file is being used by another process.");
    rl.close();
    return;
  }

  // This part of the code will only be reached if the file can be accessed.
  // Create a lock file to prevent other processes to access this file.
  createFile(lockFileLocation);

  let option = await input("1. Create\n2. Read\n3. Delete\n\nEnter Option: ");
  option = parseInt(option);

  if (option === 1) {
    let key = await input("Enter Key: ");

    // Check Key Size, Stop process if greater than 32
    if (key.length > 32) {
      console.log("Key Must be below 32 Characters");
      closeAccess();
    }

    let value = await input("Enter Value: ");

    // Check value byte size, if greater than 16KB, stop process.
    if (value.length * 2 > 16000) {
      console.log("Value Must be less than 16KB");
      closeAccess();
    }

    // Check if the value given is an JSON object. If yes, parse the string.
    if (value[0] === "{" && value[value.length - 1] === "}") {
      value = JSON.parse(value);
    }

    let time = await input("Enter Time to Live in Seconds: (Optional) ");

    // If time to live is given, get current timestamp and the seconds to it.
    time = !time ? null : Date.now() + time * 1000;

    const data = fs.readFileSync(fileLocation, "utf8");
    let writeData = {};

    if (data) {
      writeData = JSON.parse(data);
      // If the key already exits, don't overwrite it.
      if (writeData[key] !== undefined) {
        console.log("This key already exists.");
        closeAccess();
        return;
      } else {
        writeData[key] = { value };
      }
    } else {
      // If file empty or non-existent
      writeData[key] = { timeToLive: time, value };
    }
    fs.writeFile(fileLocation, JSON.stringify(writeData), closeAccess);
    console.log("Key-Value Created");
    return;
  } else if (option === 2) {
    let key = await input("Enter Key: ");
    const data = JSON.parse(fs.readFileSync(fileLocation, "utf8"));

    if (data[key] === undefined) {
      console.log("This key doesn't exist.");
    } else if (data[key].timeToLive < Date.now()) {
      // Check current timestamp with Time to Live
      console.log("You can't access this value anymore. It has expired");
    } else {
      console.log("Value:", data[key].value);
    }
    closeAccess();
    return;
  } else if (option === 3) {
    let key = await input("Enter Key: ");
    const data = JSON.parse(fs.readFileSync(fileLocation, "utf8"));

    if (data[key] === undefined) {
      console.log("This key doesn't exist.");
    } else if (data[key].timeToLive < Date.now()) {
      // Check current timestamp with Time to Live
      console.log("You can't access this value anymore. It has expired");
    } else {
      delete data[key];
      fs.writeFile(fileLocation, JSON.stringify(data), closeAccess);
      console.log("Key-Value Deleted");
    }
    return;
  } else {
    console.log("Invalid Operation");
    rl.close();
  }
}

async function input(prompt) {
  const it = rl[Symbol.asyncIterator]();
  console.log(prompt);
  return (await it.next()).value;
}

// Function to create a file.
function createFile(location) {
  let createStream = fs.createWriteStream(location);
  createStream.end();
}

// Function to delete LOCK file and close readline stream.
function closeAccess() {
  fs.unlinkSync(lockFileLocation);
  rl.close();
}

rl.on("close", () => {
  process.exit(0);
});

main();
