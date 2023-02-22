import { Branch, BranchI } from "./branch";
import { Add } from "./add";

export interface SavitI {
  name: string;
  branch: BranchI;
  checkout: (name?: string) => BranchI;
  stageFile: (path: string) => boolean;
}

export interface BranchesI {
  [name: string]: BranchI;
}

export class Savit implements SavitI {
  name: string;
  branch: BranchI;
  private branches: BranchesI;

  constructor(name?: string) {
    this.name = name || "default";
    this.branches = {};

    const branch = new Branch("main", null);
    this.add(branch);
    this.branch = branch;
  }

  private add(branch: BranchI) {
    if (!(branch.name in this.branches)) {
      this.branches[branch.name] = branch;
    } else {
      console.log(`${branch.name} branch already exists`);
    }
  }

  checkout(name?: string): BranchI {
    if (!name) {
      console.info(`Current branch: ${this.branch.name}`);
      return this.branch;
    }

    if (name in this.branches) {
      this.branch = this.branches[name];
      console.info(`Switched to branch: ${this.branch.name}`);
      return this.branch;
    }

    this.branch = new Branch(name, this.branch?.commit);
    this.add(this.branch);
    console.info(`Created and switched to: ${name}`);
    return this.branch;
  }

  stageFile(path: string): boolean {
    return new Add().stageFile(`${__dirname}/../${path}`);
  }
}
