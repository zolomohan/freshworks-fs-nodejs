var fs = require("fs");
const readline = require("readline");
const { v4: uuidv4 } = require("uuid");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter File Location (Leave it empty to create in D:/fs-files): ", (location) => {
  if (location === "") {
    location = `D:/fs-files/${uuidv4()}.txt`;
    if (!fs.existsSync("D:/fs-files")) {
      fs.mkdirSync("D:/fs-files");
    }
    let createStream = fs.createWriteStream(location);
    createStream.end();
  }

  rl.question("1. Create\n2. Read\n3. Delete\n\nEnter Option: ", (option) => {
    option = parseInt(option);

    if (option === 1) {
      rl.question("Enter Key: ", (key) => {
        rl.question("Enter Value: ", (value) => {
          fs.readFile(location, "utf8", (err, data) => {
            let writeData = {};
            if (data === undefined || data === "") {
              writeData[key] = value;
              fs.writeFile(location, JSON.stringify(writeData), () => rl.close());
              return;
            } else {
              writeData = JSON.parse(data);
              if (writeData[key] !== undefined) {
                console.log("This key already exists.");
                rl.close();
              } else {
                writeData[key] = value;
                console.log(writeData);
                fs.writeFile(location, JSON.stringify(writeData), () => rl.close());
              }
              return;
            }
          });
        });
      });
    } else if (option === 2) {
      rl.question("Enter Key: ", (key) => {
        fs.readFile(location, "utf8", (err, data) => {
          data = JSON.parse(data);
          if (data[key] === undefined) {
            console.log("This key doesn't exist.");
          } else {
            console.log("Value:", data[key]);
          }
          rl.close();
          return;
        });
      });
    } else if (option === 3) {
      rl.question("Enter Key: ", (key) => {
        fs.readFile(location, "utf8", (err, data) => {
          data = JSON.parse(data);
          if (data[key] === undefined) {
            console.log("This key doesn't exists.");
          } else {
            delete data[key];
            fs.writeFile(location, JSON.stringify(data), () => rl.close());
          }
          return;
        });
      });
    } else {
      console.log("Invalid Operation");
    }
  });
});

rl.on("close", () => process.exit(0));
