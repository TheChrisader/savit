import { Branch, BranchI } from "./branch";
import { Add } from "./add";

export interface SavitI {
  name: string;
  branch: BranchI;
  checkout: (name?: string) => BranchI;
  stageFile: (path: string) => boolean;
}

export class Savit implements SavitI {
  name: string;
  branch: BranchI;
  private branches: Branch[] | null;

  constructor(name?: string) {
    this.name = name || "default";
    this.branches = [];

    const branch = new Branch("main", null);
    this.add(branch);
    this.branch = branch;
  }

  private add(branch: BranchI) {
    this.branches?.push(branch);
  }

  checkout(name?: string): BranchI {
    if (!name) {
      console.info(`Current branch: ${this.branch.name}`);
      return this.branch;
    }

    const branchIndex = this.branches?.findIndex(
      (branch: BranchI) => branch.name === name
    );

    if (
      branchIndex !== undefined &&
      branchIndex !== -1 &&
      this.branches?.length
    ) {
      this.branch = this.branches[branchIndex];
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
