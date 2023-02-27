import { promises as fs } from "fs";
import HDT from "../src/objects/hdt";

describe("HDT", () => {
  const dirPath = __dirname + "/hdt_test";
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

  test("Should create an instance of the HDT Class without getting file tree from hdt_test folder", () => {
    const hdt = new HDT(`${__dirname}/hdt_test`);
    expect(hdt.path).toEqual(`${__dirname}/hdt_test`);
    expect(hdt.leaves).toEqual([]);
  });

  test("Should create an instance of the HDT Class and get file tree from hdt_test folder", async () => {
    const hdt = new HDT(`${__dirname}/hdt_test`);
    await hdt.getFileTree();
    const leaves = hdt.leaves;

    const files = await fs.readdir(`${__dirname}/hdt_test`);
    files.forEach(async (file, i) => {
      const filePath = `${__dirname}/hdt_test/${file}`;
      const hashedFile = await HDT.hashFile(filePath);

      expect(leaves).toHaveLength(3);
      expect(leaves[i].path).toEqual(filePath);
      expect(leaves[i].hash).toEqual(hashedFile);
    });
  });

  test("Should build the HDT tree", async () => {
    const hdt = new HDT(`${__dirname}/hdt_test`);
    await hdt.getFileTree();
    hdt.buildTree();
    const leaves = hdt.leaves;

    expect(leaves).toHaveLength(3);
    expect(hdt.nodes).toBeDefined();
  });

  test("Should add a node to the file tree", async () => {
    const hdt = new HDT(`${__dirname}/hdt_test`);
    await hdt.getFileTree();
    await fs.writeFile(dirPath + "/test.txt", "File Written");

    await hdt.addNode(dirPath + "/test.txt");

    expect(hdt.leaves).toHaveLength(4);
    expect(hdt.nodes).toBeDefined();

    await fs.unlink(dirPath + "/test.txt");
  });

  test("Should remove a node to the file tree", async () => {
    const hdt = new HDT(`${__dirname}/hdt_test`);
    await hdt.getFileTree();

    await hdt.removeNode(filePaths[0]);

    expect(hdt.leaves).toHaveLength(2);
    expect(hdt.nodes).toBeDefined();
  });

  test("Should detect changes between two HDTs", async () => {
    const hdt = new HDT(`${__dirname}/hdt_test`);
    await hdt.getFileTree();
    await hdt.buildTree();

    const filePath = dirPath + "/test.txt";
    await fs.writeFile(filePath, "File Written");

    const hdt2 = new HDT(`${__dirname}/hdt_test`);
    await hdt2.getFileTree();
    await hdt2.buildTree();

    const changes = await hdt.compare(hdt2.nodes);

    expect(changes).toHaveLength(1);
    expect(changes![0]).toEqual(filePath);

    await fs.unlink(dirPath + "/test.txt");
  });
});
