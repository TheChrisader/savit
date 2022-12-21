import sha1 from "sha1";
import * as fs from "fs";

export interface CommitI {
  id: string;
  message: string;
  parent: CommitI | null;
  getCommitLog: () => string[];
}

export class Commit implements CommitI {
  readonly id: string;
  parent: CommitI | null;
  message: string;
  content: string;

  constructor(message: string, parent: CommitI | null = null) {
    this.message = message;
    this.parent = parent;
    this.content = this.getStore();
    this.id = sha1(this.content);
    this.clearStore();
  }

  private clearStore(): void {
    fs.writeFileSync(`${__dirname}/../store.txt`, "");
  }

  private getStore(): string {
    const readed = fs.readFileSync(`${__dirname}/../store.txt`, {
      encoding: "utf8",
    });
    return readed;
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
