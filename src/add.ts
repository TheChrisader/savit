import * as fs from "fs";

export interface AddI {
  stageFile: (path: string) => boolean;
  stagedFiles: () => void;
}

export class Add implements AddI {
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || "./store.txt";
  }

  stageFile(path: string): boolean {
    console.log(path);
    if (fs.existsSync(path)) {
      try {
        fs.writeFileSync(this.dbPath, path);
        return true;
      } catch (err) {
        console.log("Error on add", err);
        return false;
      }
    }
    console.error(`file path ${path} does not exist`);
    return false;
  }

  stagedFiles(): string {
    return fs.readFileSync(this.dbPath, { encoding: "utf8" });
  }
}
