import { CommitI } from "./commit";

export interface BranchI {
  name: string;
  commit: CommitI | null;
}

export class Branch implements BranchI {
  name: string;
  commit: CommitI | null;

  constructor(name: string, commit: CommitI | null = null) {
    this.name = name;
    this.commit = commit;
  }
}
