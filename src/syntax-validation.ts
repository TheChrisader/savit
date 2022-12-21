import { Commit } from "./commit";
import { SavitI } from "./savit";

const VALID_VALUES = [
  "savit",
  "add",
  "-m",
  "log",
  "commit",
  "branch",
  "checkout",
];

const isCommandStartProperly = (value: string): boolean => {
  const splitted = value.split(" ");
  if (!value.startsWith("savit")) {
    console.error("\x1b[31mInvalid command:\x1b[0m start with 'savit'");
    return false;
  }

  if (splitted.length === 1) {
    console.error(
      "x1b31mInvalid command:\x1b[0m please use 'savit' with other available commands: ",
      VALID_VALUES
    );
    return false;
  }

  return true;
};

const isCheckoutCommandValid = (
  value: string,
  savit: SavitI,
  splittedValue: string[]
): boolean | void => {
  if (value.includes("checkout") && !VALID_VALUES.includes(splittedValue[2])) {
    const branchName = splittedValue[2];
    savit.checkout(branchName);
    return true;
  }

  if (value.includes("checkout") && splittedValue.length === 2) {
    savit.checkout();
    return true;
  }
};

const isBranchCommandValid = (
  value: string,
  savit: SavitI,
  splittedValue: string[]
): boolean | void => {
  if (
    value.includes("branch") &&
    value.includes("-m") &&
    !VALID_VALUES.includes(splittedValue[3])
  ) {
    const branchName = splittedValue[3];
    savit.checkout(branchName);
    return true;
  }
};

const isLogCommandValid = (
  value: string,
  savit: SavitI,
  splittedValue: string[]
): boolean | void => {
  if (value.includes("log") && splittedValue.length === 2) {
    const history = savit.branch.commit?.getCommitLog();
    if (!history?.length) {
      console.info("Make a commit first!");
      return true;
    }
    console.info("\x1b[42mCommit history: \x1b[0m\n", history);
    return true;
  }
};

const isCommitCommandValid = (
  value: string,
  savit: SavitI,
  splittedValue: string[]
): boolean | void => {
  if (
    value.includes("commit") &&
    value.includes("-m") &&
    !VALID_VALUES.includes(splittedValue[3])
  ) {
    const splitMessage = splittedValue.slice(3).join(" ");
    if (splitMessage.length > 50) {
      console.error("commit should be less than 50 characters");
    }
    const commitMessage = splitMessage;
    savit.branch.commit = new Commit(commitMessage, savit.branch.commit);
    return true;
  }
};

const isAddCommandValid = (
  value: string,
  savit: SavitI,
  splittedValue: string[]
): boolean | void => {
  if (
    value.includes("add") &&
    splittedValue.length === 3 &&
    !VALID_VALUES.includes(splittedValue[2])
  ) {
    savit.stageFile(splittedValue[2]);
    return;
  } else {
    console.error(
      "\x1b[31mInvalid command:\x1b[0m 'add' must be followed by file path"
    );
    return;
  }
};

export const syntaxValidator = (value: string, savit: SavitI) => {
  if (!isCommandStartProperly(value)) return;
  const splitted = value.split(" ");
  if (isCheckoutCommandValid(value, savit, splitted)) return;
  if (isBranchCommandValid(value, savit, splitted)) return;
  if (isLogCommandValid(value, savit, splitted)) return;
  if (isCommitCommandValid(value, savit, splitted)) return;
  if (isAddCommandValid(value, savit, splitted)) return;
};
