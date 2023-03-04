import { promises as fs } from "fs";
import { HDTI } from "./objects/hdt";
import { ChangesI } from "./utils/commitLifecycle";
import sha1Hash from "./utils/sha1Hash";

export interface CommitI {
  id: string;
  message: string;
  parent: CommitI | null;
  snapshot: HDTI;
  getCommitLog: () => string[];
  generateObjects: (changes: ChangesI, dirPath: string) => void;
}

export class Commit implements CommitI {
  readonly id: string;
  parent: CommitI | null;
  message: string;
  snapshot: HDTI;

  constructor(
    message: string,
    parent: CommitI | null = null,
    // changes: ChangesI,
    tree: HDTI
  ) {
    this.id = tree.nodes?.get("hash") as string;
    this.message = message;
    this.parent = parent;
    this.snapshot = tree;
  }

  async generateObjects(changes: ChangesI, dirPath: string = "") {
    if (dirPath) {
      dirPath = dirPath + "/";
    }
    for (let file of Object.keys(changes)) {
      let hash = await this.snapshot.getHash!(file);
      let folderName = hash!.substring(0, 2);
      let fileName = hash!.substring(2);
      try {
        await fs.mkdir(`${dirPath}.savit/objects/${folderName}`);
      } catch (err: any) {
        if (err.code !== "EEXIST") console.log(err);
      }
      await fs.writeFile(
        `${dirPath}.savit/objects/${folderName}/${fileName}`,
        JSON.stringify(changes[file])
      );
    }
  }

  getCommitLog(): string[] {
    let currentCommit: CommitI | null = this;
    const commitHistory: string[] = [];
    while (currentCommit) {
      commitHistory.push(`${currentCommit.id}: ${currentCommit.message}`);
      currentCommit = currentCommit.parent;
    }
    return commitHistory;
  }
}
