import { Branch, BranchI } from "./branch";
import HDT, { HDTI } from "./objects/hdt";
import { reconstructDirectory } from "./utils/commitLifecycle";
import createSavitFolder from "./utils/createFolder";

export interface SavitI {
  name: string;
  branch: BranchI;
  fileTree: HDTI;
  snapshot: HDTI;
  checkout: (name?: string, savitFolder?: string) => BranchI;
  stageFile: (path: string) => Promise<string[]>;
}

export interface BranchesI {
  [name: string]: BranchI;
}

export class Savit implements SavitI {
  name: string;
  branch: BranchI;
  fileTree: HDTI;
  snapshot: HDTI;
  private branches: BranchesI;

  constructor(name?: string, path: string = ".") {
    this.name = name || "default";
    this.branches = {};
    this.fileTree = new HDT(path);
    this.snapshot = new HDT(path);

    const branch = new Branch("main", null);
    this.add(branch);
    this.branch = branch;
  }

  async init(path?: string) {
    await this.fileTree.getFileTree!();
    await this.fileTree.buildTree!();
    createSavitFolder(path);
  }

  private add(branch: BranchI) {
    if (!(branch.name in this.branches)) {
      this.branches[branch.name] = branch;
    } else {
      console.log(`${branch.name} branch already exists`);
    }
  }

  checkout(name?: string, savitFolder: string = ""): BranchI {
    if (!name) {
      console.info(`Current branch: ${this.branch.name}`);
      return this.branch;
    }

    if (name in this.branches) {
      if (savitFolder) {
        savitFolder = savitFolder + "/";
      }

      this.branch = this.branches[name];
      if (this.branch.commit)
        reconstructDirectory(this.branch.commit, savitFolder);
      console.info(`Switched to branch: ${this.branch.name}`);
      return this.branch;
    }

    this.branch = new Branch(name, this.branch?.commit);
    this.add(this.branch);
    console.info(`Created and switched to: ${name}`);
    return this.branch;
  }

  async stageFile(path?: string) {
    let changes = [] as string[];
    if (path) {
      await this.snapshot.addNode!(path);
      changes.push(path);
    } else {
      let edits = this.snapshot.compare!(
        this.branch.commit?.parent?.snapshot.nodes
      );
      if (edits) changes.push(...edits);
    }
    return changes;
  }
}
