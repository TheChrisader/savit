import { Savit } from "../src/savit";

describe("Savit", () => {
  test("should return repo name properly", () => {
    const repo = new Savit("first-repo");
    expect(repo.name).toEqual("first-repo");
  });
});
