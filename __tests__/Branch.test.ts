import { Branch } from "../src/branch";

describe("Branch", () => {
  test("should create a branch", () => {
    const branch = new Branch("master");
    expect(branch.name).toEqual("master");
  });
});
