import { promises as fs } from "fs";
import HDT from "../objects/hdt";
import { CommitI } from "../commit";
import { LeafI, NodeI } from "../objects/hdt";

export interface LinesI {
  lineNum: number;
  value: string;
  replaced?: string;
}

export interface EditsI {
  [lines: string]: LinesI[];
}

export interface ChangesI {
  [filePath: string]: EditsI;
}

export async function clearDirectory(directoryPath: string = ".") {
  const files = await fs.readdir(directoryPath);

  for (const file of files) {
    const filePath = directoryPath + "/" + file;
    if (filePath.includes(".savit")) continue;

    if ((await fs.lstat(filePath)).isDirectory()) {
      clearDirectory(filePath);
    } else {
      await fs.unlink(filePath);
    }
  }
}

export async function reconstructDirectory(
  commit: CommitI,
  savitFolder: string = ""
) {
  if (savitFolder) {
    savitFolder = savitFolder + "/";
  }
  let tree: Map<string, NodeI | string> | undefined = commit.snapshot.nodes;

  for (let [key, value] of tree!?.entries()) {
    if (key === "hash" || typeof value === "string") continue;

    for (let file of value.children) {
      let parts = file.path.split("/");
      let newFile = parts[parts.length - 1];
      let parentPath = parts.slice(0, -1).join("/");
      let reconstructedFile = await reconstructFile(
        commit,
        file.path,
        savitFolder
      );
      try {
        await fs.mkdir(parentPath, { recursive: true });
      } catch (err: any) {
        if (err.code !== "EEXIST") console.log(err);
      }
      await fs.writeFile(file.path, reconstructedFile);
    }
  }
}

export function myersDiff(
  currentFile: string[],
  comparedFile: string[]
): string[][] {
  const arr = new Array(currentFile.length + 1);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = new Array(comparedFile.length + 1);
  }

  for (let i = 0; i <= currentFile.length; i++) {
    for (let j = 0; j <= comparedFile.length; j++) {
      if (i === 0) {
        arr[i][j] = 0;
      } else if (j === 0) {
        arr[i][j] === 0;
      } else if (currentFile[i - 1] === comparedFile[j - 1]) {
        arr[i][j] = arr[i - 1][j - 1] + 1;
      } else {
        arr[i][j] = Math.max(arr[i][j - 1], arr[i - 1][j]);
      }
    }
  }

  return arr;
}

export function tracebackLines(
  arr: string[][],
  aLines: string[],
  bLines: string[]
) {
  let i = aLines.length,
    j = bLines.length;

  const edits: EditsI = {
    insertedLines: [],
    deletedLines: [],
    replacedLines: [],
  };

  while (i > 0 && j > 0) {
    if (aLines[i - 1] === bLines[j - 1]) {
      i--;
      j--;
    } else if (arr[i][j - 1] > arr[i - 1][j]) {
      edits.insertedLines.push({
        lineNum: j - 1,
        value: bLines[j - 1],
      });
      j--;
    } else if (arr[i - 1][j] > arr[i][j - 1]) {
      edits.deletedLines.push({
        lineNum: i - 1,
        value: aLines[i - 1],
      });
      i--;
    } else {
      edits.replacedLines.push({
        lineNum: i - 1,
        value: bLines[j - 1],
        // replaced: aLines[i - 1],
      });
      i--;
      j--;
    }
  }

  while (i > 0) {
    edits.deletedLines.push({
      lineNum: i - 1,
      value: aLines[i - 1],
    });
    i--;
  }

  while (j > 0) {
    edits.insertedLines.push({
      lineNum: j - 1,
      value: bLines[j - 1],
    });
    j--;
  }

  for (let lines in edits) {
    edits[lines].reverse();
  }

  return edits;
}

export async function generateChanges(
  parent: CommitI | null,
  filePath: string,
  savitFolder: string = ""
) {
  if (savitFolder) {
    savitFolder = savitFolder + "/";
  }

  let retrieveParentFile = await reconstructFile(parent, filePath, savitFolder);
  let parentFile = retrieveParentFile.split("\n").map((line: string) => {
    if (line[line.length - 1] === "\r") {
      line = line.slice(0, -1);
    }
    return line;
  });

  let readCurrentFile = await fs.readFile(filePath, "utf-8");
  let currentFile = readCurrentFile.split("\n").map((line) => {
    if (line[line.length - 1] === "\r") {
      line = line.slice(0, -1);
    }
    return line;
  });

  const diffPath = myersDiff(parentFile, currentFile);
  const changes = tracebackLines(diffPath, parentFile, currentFile);

  return changes;
}

export async function reconstructFile(
  commit: CommitI | null,
  filePath: string,
  savitFolder: string = ""
): Promise<string> {
  let hash = await commit!?.snapshot!.getHash!(filePath);

  if (!commit || !hash) {
    return "";
  }

  let folderName = hash!.substring(0, 2);
  let fileName = hash!.substring(2);

  let retrievedChanges = await fs.readFile(
    `${savitFolder}.savit/objects/${folderName}/${fileName}`,
    "utf-8"
  );

  let changes = JSON.parse(retrievedChanges);

  let previousState = await reconstructFile(
    commit.parent,
    filePath,
    savitFolder
  );

  return applyChanges(previousState, changes);
}

export function applyChanges(currentFile: string, changes: EditsI) {
  let insertedLines = changes.insertedLines || [];
  let deletedLines = changes.deletedLines || [];
  let replacedLines = changes.replacedLines || {};
  let currentLines = currentFile.split("\n");

  replacedLines.forEach((line) => {
    currentLines[line.lineNum] = line.value;
  });

  insertedLines.forEach((line) => {
    let lineNum = line.lineNum;
    currentLines.splice(lineNum, 0, line.value);
  });

  deletedLines.forEach((line) => {
    let lineNum = currentLines.indexOf(line.value);
    if (lineNum >= 0) {
      currentLines.splice(lineNum, 1);
    }
  });

  return currentLines.join("\n");
}
