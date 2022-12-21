import { Add } from "../src/add";

describe("Add", () => {
  test("should stage a file into db-test", () => {
    const add = new Add(`${__dirname}/db-test.txt`);
    const result = add.stageFile(`${__dirname}/test-file.txt`);

    expect(result).toBeTruthy();
    expect(add.stagedFiles()).toEqual(`${__dirname}/test-file.txt`);
  });

  test("should stage a file into store.txt", () => {
    const add = new Add();
    const result = add.stageFile(`${__dirname}/test-file.txt`);

    expect(result).toBeTruthy();
    expect(add.stagedFiles()).toEqual(`${__dirname}/test-file.txt`);
  });

  test("should not stage a file that does not exist", () => {
    const add = new Add(`${__dirname}/db-test.txt`);
    const result = add.stageFile(`${__dirname}/does-not-exist.txt`);

    expect(result).toBeFalsy();
  });
});
