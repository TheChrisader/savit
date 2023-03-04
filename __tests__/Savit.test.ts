import { promises as fs } from "fs";

import { Savit } from "../src/savit";
import { Commit } from "../src/commit";
import {
  ChangesI,
  clearDirectory,
  generateChanges,
  reconstructDirectory,
} from "../src/utils/commitLifecycle";

describe("Savit", () => {
  const dirPath = __dirname + "/savit_test";
  const filePaths = ["file1.txt", "file2.txt", "file3.txt"].map(
    (filePath) => dirPath + "/" + filePath
  );

  beforeEach(async () => {
    await fs.mkdir(dirPath);
    filePaths.forEach(async (filePath, i) => {
      await fs.writeFile(filePath, "File Content " + i, "utf-8");
    });
  });

  afterEach(async () => {
    await fs.rm(dirPath, { recursive: true });
  });

  test("should initialize a repo properly", async () => {
    const repo = new Savit("first-repo", dirPath);
    await repo.init(dirPath);
    const getHead = await fs.readFile(dirPath + "/.savit/HEAD.txt", "utf-8");

    expect(repo.name).toEqual("first-repo");
    expect(repo.branch.name).toEqual("main");
    expect(repo.branch.commit).toBeNull();
    expect(repo.fileTree).toBeDefined();
    expect(repo.fileTree.nodes).toBeDefined();
    expect(repo.snapshot).toBeDefined();
    expect(repo.snapshot.nodes).toBeUndefined();
    expect(getHead).toEqual("null");
  });

  test("should create commit and repo", async () => {
    const repo = new Savit("repository", dirPath);
    await repo.init(dirPath);
    await repo.snapshot.addNode!(filePaths[0]);

    repo.branch.commit = new Commit(
      "message",
      repo.branch.commit,
      repo.snapshot
    );
    const commit = repo.branch.commit;

    expect(repo.name).toEqual("repository");
    expect(commit?.message).toEqual("message");
    expect(commit.snapshot).toEqual(repo.snapshot);
  });

  test("should create savit folder", async () => {
    const repo = new Savit("repository", dirPath);
    await repo.init(dirPath);

    const doesFolderExist = await (
      await fs.lstat(dirPath + "/" + ".savit")
    ).isDirectory();

    expect(doesFolderExist).toEqual(true);
  });

  test("should return commit history", async () => {
    const repo = new Savit("repository", dirPath);
    await repo.init(dirPath);

    await repo.snapshot.addNode!(filePaths[0]);
    repo.branch.commit = new Commit(
      "commit",
      repo.branch.commit,
      repo.snapshot
    );

    await repo.snapshot.addNode!(filePaths[1]);
    const firstCommit = repo.branch.commit;
    repo.branch.commit = new Commit("commit2", firstCommit, repo.snapshot);

    await repo.snapshot.addNode!(filePaths[2]);
    const secondCommit = repo.branch.commit;

    expect(repo.branch.commit?.getCommitLog()).toEqual([
      `${secondCommit.id}: ${secondCommit.message}`,
      `${firstCommit.id}: ${firstCommit.message}`,
    ]);
  });

  test("should be able to checkout to a new branch", async () => {
    const repo = new Savit("repository", dirPath);
    await repo.init(dirPath);

    const currBranch = repo.checkout("master");

    expect(currBranch.name).toEqual(repo.checkout("master").name);

    repo.checkout("test");
    expect(repo.checkout("test").name).toEqual("test");
  });

  test("should reconstruct directory on new branch checkout", async () => {
    const repo = new Savit("repository", dirPath);
    await repo.init(dirPath);

    let addedFiles = await repo.stageFile(filePaths[0]);
    let changes: ChangesI = {};
    for (let file of addedFiles) {
      let change = await generateChanges(repo.branch.commit, file, dirPath);
      changes[file] = change;
    }

    repo.branch.commit = new Commit(
      "commit",
      repo.branch.commit,
      repo.snapshot
    );
    await repo.branch.commit.generateObjects(changes, dirPath);

    repo.checkout("master");
    await clearDirectory(dirPath);
    let dir = await fs.readdir(dirPath);

    expect(repo.branch.name).toEqual("master");
    expect(dir).toEqual([".savit"]);

    await reconstructDirectory(repo.branch.commit, dirPath);
    dir = await fs.readdir(dirPath);

    expect(dir).toEqual([".savit", "file1.txt"]);
  });

  test("should be able to stage a file", async () => {
    const repo = new Savit("repository", dirPath);
    await repo.init(dirPath);

    const result = await repo.stageFile(filePaths[0]);
    expect(result).toEqual([filePaths[0]]);
  });

  test("should be able to keep commit history", async () => {
    const repo = new Savit("repo", dirPath);
    await repo.init(dirPath);
    repo.stageFile(filePaths[0]);

    let branch = repo.branch;
    const commit = branch.commit;
    const firstCommit = new Commit("commit", commit, repo.snapshot);
    branch.commit = firstCommit;

    repo.checkout("master");
    branch = repo.branch;
    const secondCommit = new Commit("commit2", firstCommit, repo.snapshot);
    branch.commit = secondCommit;

    repo.checkout("master2");
    branch = repo.branch;
    const thirdCommit = new Commit("commit3", secondCommit, repo.snapshot);
    branch.commit = thirdCommit;

    repo.checkout("master3");
    branch = repo.branch;

    expect(branch.commit?.getCommitLog()).toEqual([
      `${thirdCommit.id}: ${thirdCommit.message}`,
      `${secondCommit.id}: ${secondCommit.message}`,
      `${firstCommit.id}: ${firstCommit.message}`,
    ]);
  });
});
