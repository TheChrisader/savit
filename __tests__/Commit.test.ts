import sha1 from "sha1";
import { Commit } from "../src/commit";

describe("Commit", () => {
  test("should create a new commit with correct hash and message", () => {
    const commit = new Commit("message");
    expect(commit.message).toEqual("message");
    expect(commit.id).toEqual(sha1(commit.content));
  });
});
