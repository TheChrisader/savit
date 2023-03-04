import { promises as fs } from "fs";
import { Commit } from "../src/commit";
import HDT from "../src/objects/hdt";

describe("Commit", () => {
  const dirPath = __dirname + "/commit_test";
  const filePaths = ["file1.txt", "file2.txt", "file3.txt"].map(
    (filePath) => dirPath + "/" + filePath
  );

  beforeAll(async () => {
    await fs.mkdir(dirPath);
    filePaths.forEach(async (filePath, i) => {
      await fs.writeFile(filePath, "File Content " + i, "utf-8");
    });
  });

  afterAll(async () => {
    await fs.rm(dirPath, { recursive: true });
  });

  test("should create a new commit with correct hash and message", async () => {
    const hdt = new HDT(dirPath);
    await hdt.getFileTree();
    hdt.buildTree();

    const commit = new Commit("message", null, hdt);

    const changes = await hdt.compare(commit.snapshot.nodes);

    expect(commit.id).toEqual(hdt.nodes?.get("hash"));
    expect(commit.message).toEqual("message");
    expect(commit.parent).toBeNull();
    expect(changes).toBeNull();
  });
});
