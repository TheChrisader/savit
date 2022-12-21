console.info("> Savit - Version: 0.0.0.1");
console.info("> Ctrl + C to close");

import * as readline from "readline";
import { Savit } from "./savit";
import { syntaxValidator } from "./syntax-validation";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const savit = new Savit();

const readCommand = () => {
  rl.question("savit> ", (command: string) => {
    syntaxValidator(command, savit);
    readCommand();
  });
};

rl.on("close", function () {
  console.log("\nSee you, Space Cowboy");
  process.exit(0);
});

readCommand();
