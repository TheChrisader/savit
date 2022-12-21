import { Savit } from "../src/savit";
import { Commit } from "../src/commit";
import { resolve } from "path";

describe("Savit", () => {
  test("should return repo name properly", () => {
    const repo = new Savit("first-repo");
    expect(repo.name).toEqual("first-repo");
  });

  test("should create commit and repo", () => {
    const repo = new Savit("repository");
    repo.branch.commit = new Commit("message", repo.branch.commit);
    const commit = repo.branch.commit;

    expect(commit?.message).toEqual("message");
    expect(repo.name).toEqual("repository");
  });

  test("should return commit history", () => {
    const repo = new Savit();
    repo.branch.commit = new Commit("commit", repo.branch.commit);
    const firstCommit = repo.branch.commit;
    repo.branch.commit = new Commit("commit2", firstCommit);
    const secondCommit = repo.branch.commit;

    expect(repo.branch.commit?.getCommitLog()).toEqual([
      `${secondCommit.id}: ${secondCommit.message}`,
      `${firstCommit.id}: ${firstCommit.message}`,
    ]);
  });

  test("should be able to checkout default branch", () => {
    const repo = new Savit();
    const currBranch = repo.checkout("master");

    expect(currBranch.name).toEqual("master");
  });

  test("should create a new branch on checkout", () => {
    const repo = new Savit();
    const currBranch = repo.checkout("master");

    expect(currBranch.name).toEqual("master");
    expect(repo.checkout("master").name).toEqual("master");

    repo.checkout("test");

    expect(repo.checkout("test").name).toEqual("test");
  });

  test("should be able to stage a file", () => {
    const repo = new Savit();
    const result = repo.stageFile(`__tests__/test-file.txt`);
    expect(result).toBeTruthy();
  });

  test("should be able to keep commit history", () => {
    const repo = new Savit();
    let branch = repo.branch;
    const commit = branch.commit;
    const firstCommit = new Commit("commit", commit);
    branch.commit = firstCommit;
    repo.checkout("master");
    branch = repo.branch;

    const secondCommit = new Commit("commit2", firstCommit);
    branch.commit = secondCommit;
    repo.checkout("master2");
    branch = repo.branch;

    const thirdCommit = new Commit("commit3", secondCommit);
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
