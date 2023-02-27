import crypto from "crypto";
import { promises as fs } from "fs";

export interface LeafI {
  path: string;
  hash: string;
}

export interface NodeI {
  children: LeafI[];
  hash: string;
}

export interface HDTI {
  path: string;
  leaves: LeafI[];
  nodes: Map<string, NodeI | string> | undefined;
}

class HDT implements HDTI {
  path: string;
  leaves: LeafI[];
  nodes: Map<string, NodeI | string> | undefined;

  constructor(path: string = ".") {
    this.path = path;
    this.leaves = [];
  }

  async getFileTree() {
    await this.divideFileSystemIntoLeaves(this.path);
  }

  async getHash(path: string) {
    let stats = await fs.lstat(path);
    if (stats.isDirectory()) {
      let node = this.nodes?.get(path) as NodeI;
      return node.hash;
    } else {
      let leaf = this.leaves.find((leaf) => leaf.path === path);
      return leaf?.hash;
    }
  }

  static async hashFile(path: string) {
    let hash = crypto.createHash("sha1");
    let file = await fs.readFile(path, "utf-8");

    return hash.update(file).digest("hex");
  }

  static async hashDirectory(path: string) {
    let hash = crypto.createHash("sha1");
    let files = await fs.readdir(path);

    files.forEach(async (file) => {
      let filePath = path + "/" + file;
      let fileData = await fs.readFile(filePath, "utf-8");
      hash.update(fileData);
    });
    return hash.digest("hex");
  }

  private updateTree() {
    this.nodes?.clear();
    this.buildTree();
  }

  private async divideFileSystemIntoLeaves(path: string) {
    try {
      let stats = await fs.lstat(path);

      if (stats.isDirectory()) {
        let files = await fs.readdir(path);
        for (let file of files) {
          let filePath = path + "/" + file;
          await this.divideFileSystemIntoLeaves(filePath);
        }
      } else {
        let hash = await HDT.hashFile(path);
        let leaf: LeafI = { path, hash };
        this.leaves.push(leaf);
      }
    } catch (err) {
      console.log(err);
    }
  }

  buildTree() {
    try {
      this.nodes = new Map();
      for (let leaf of this.leaves) {
        let parts = leaf.path.split("/");
        let parentPath = parts.slice(0, -1).join("/");
        let parentNode = this.nodes.get(parentPath) as NodeI;
        if (parentNode) {
          parentNode.children.push({ path: leaf.path, hash: leaf.hash });
        } else {
          parentNode = {
            children: [{ path: leaf.path, hash: leaf.hash }],
            hash: "",
          };
          this.nodes.set(parentPath, parentNode);
        }
      }

      for (let node of this.nodes.values() as IterableIterator<NodeI>) {
        node.children.sort((a, b) => a.hash.localeCompare(b.hash));
        let childrenHashes = node.children.reduce(
          (acc, curr) => acc + curr.hash,
          ""
        );
        node.hash = crypto
          .createHash("sha1")
          .update(childrenHashes)
          .digest("hex");
      }

      let nodes = [...this.nodes.values()] as NodeI[];
      nodes.sort((a, b) => a.hash.localeCompare(b.hash));
      let hashes: string = nodes.reduce((acc, curr) => acc + curr.hash, "");
      this.nodes.set(
        "hash",
        crypto.createHash("sha1").update(hashes).digest("hex")
      );
    } catch (err) {
      console.log(err);
    }
  }

  async addNode(path: string) {
    let stats = await fs.lstat(path);
    if (stats.isDirectory()) {
      let node = { children: [] as LeafI[], hash: "" };
      this.nodes?.set(path, node);
    } else {
      let hash = await HDT.hashFile(path);
      let leaf = { path, hash };
      this.leaves.push(leaf);
    }

    this.updateTree();
  }

  async removeNode(path: string) {
    let stats = await fs.lstat(path);
    if (stats.isDirectory()) {
      this.nodes?.delete(path);
    } else {
      let index = this.leaves.findIndex((leaf) => leaf.path === path);
      this.leaves.splice(index, 1);
    }
    this.updateTree();
  }

  compare(tree: Map<string, NodeI | string> | undefined) {
    let changes = [];
    if (tree?.get("hash") !== this.nodes?.get("hash")) {
      for (let [key, value] of this.nodes!.entries()) {
        let compareValue = tree?.get(key);
        if (
          key === "hash" ||
          typeof value === "string" ||
          typeof compareValue === "string"
        )
          continue;

        if (value.hash === compareValue?.hash) continue;

        for (let i = 0; i < value.children.length; i++) {
          let pathName = value.children[i].path;
          let compareCommit = compareValue?.children.find(
            (file) => file.path === pathName
          );

          if (!compareCommit) {
            changes.push(pathName);
            continue;
          }

          if (value.children[i].hash !== compareCommit.hash) {
            changes.push(pathName);
          }
        }
      }

      for (let [key, value] of tree!.entries()) {
        let currentValue = this.nodes?.get(key);
        if (
          key === "hash" ||
          typeof value === "string" ||
          typeof currentValue === "string"
        )
          continue;

        if (value.hash === currentValue?.hash) continue;

        for (let i = 0; i < value.children.length; i++) {
          let pathName = value.children[i].path;
          let currentCommit = currentValue?.children.find(
            (file) => file.path === pathName
          );

          if (!currentCommit) {
            changes.push(pathName);
            continue;
          }
        }
      }
    }
    return changes.length === 0 ? null : changes;
  }

  async validate(path: string) {
    try {
      let stats = await fs.lstat(path);
      if (stats.isDirectory()) {
        let node = this.nodes?.get(path) as NodeI;
        let calculatedHash = await HDT.hashDirectory(path);
        return calculatedHash === node?.hash;
      } else {
        let leaf = this.leaves.find((leaf) => leaf.path === path);

        let calculatedHash = await HDT.hashFile(path);
        return leaf?.hash === calculatedHash;
      }
    } catch (err) {
      console.log(err);
    }
  }
}

export default HDT;
