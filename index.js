var fs = require("fs");
const readline = require("readline");
const { v4: uuidv4 } = require("uuid");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let lockFileLocation = null;

rl.question("Enter File Location (Leave it empty to create in D:/fs-files): ", (fileLocation) => {
  if (!fileLocation) {
    fileLocation = `D:/fs-files/${uuidv4()}.txt`;
    if (!fs.existsSync("D:/fs-files")) fs.mkdirSync("D:/fs-files");
    createFile(fileLocation);
  }

  let stats = fs.statSync(fileLocation);
  if (stats.size > 1024 * 1000000) {
    console.log("File Size is Greater than 1GB");
    rl.close();
  }

  lockFileLocation = fileLocation.split(".")[0] + ".lock";

  if (fs.existsSync(lockFileLocation)) {
    console.log("This file is being used by another process.");
    rl.close();
    return;
  }

  createFile(lockFileLocation);

  rl.question("1. Create\n2. Read\n3. Delete\n\nEnter Option: ", (option) => {
    option = parseInt(option);

    if (option === 1) {
      rl.question("Enter Key: ", (key) => {
        if (key.length > 32) {
          console.log("Key Must be below 32 Characters");
          closeAccess();
        }

        rl.question("Enter Value: ", (value) => {
          if (value[0] === "{" && value[value.length - 1] === "}") {
            value = JSON.parse(value);
          }

          if(value.length * 2 > 16000) {
            console.log("Value Must be less than 16KB")
            closeAccess();
          }

          rl.question("Enter Time to Live in Seconds: (Optional) ", (time) => {
            time = time === "" ? null : Date.now() + time * 1000;

            fs.readFile(fileLocation, "utf8", (err, data) => {
              let writeData = {};
              if (data === undefined || data === "") {
                writeData[key] = { timeToLive: time, value };
                fs.writeFile(fileLocation, JSON.stringify(writeData), closeAccess);
                return;
              } else {
                writeData = JSON.parse(data);
                if (writeData[key] !== undefined) {
                  console.log("This key already exists.");
                  closeAccess();
                } else {
                  writeData[key] = value;
                  fs.writeFile(fileLocation, JSON.stringify(writeData), closeAccess);
                }
                return;
              }
            });
          });
        });
      });
    } else if (option === 2) {
      rl.question("Enter Key: ", (key) => {
        fs.readFile(fileLocation, "utf8", (err, data) => {
          data = JSON.parse(data);
          if (data[key] === undefined) {
            console.log("This key doesn't exist.");
          } else if (data[key].timeToLive < Date.now()) {
            console.log("You can't access this value anymore. It has expired");
          } else {
            console.log("Value:", data[key].value);
          }
          closeAccess();
          return;
        });
      });
    } else if (option === 3) {
      rl.question("Enter Key: ", (key) => {
        fs.readFile(fileLocation, "utf8", (err, data) => {
          data = JSON.parse(data);
          if (data[key] === undefined) {
            console.log("This key doesn't exists.");
          } else if (data[key].timeToLive < Date.now()) {
            console.log("You can't access this value anymore. It has expired");
          } else {
            delete data[key];
            fs.writeFile(fileLocation, JSON.stringify(data), closeAccess);
          }
          return;
        });
      });
    } else {
      console.log("Invalid Operation");
    }
  });
});

function createFile(location) {
  let createStream = fs.createWriteStream(location);
  createStream.end();
}

function closeAccess() {
  fs.unlinkSync(lockFileLocation);
  rl.close();
}

rl.on("close", () => {
  process.exit(0);
});
