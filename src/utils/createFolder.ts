import fs from "fs";

function createSavitFolder() {
  try {
    fs.mkdirSync(".savit");
    fs.writeFileSync(".savit/HEAD.txt", "null");
    fs.writeFileSync(".savit/index.txt", "");
    fs.mkdirSync(".savit/objects");
    fs.mkdirSync(".savit/refs");
    fs.mkdirSync(".savit/refs/heads");
    fs.mkdirSync(".savit/refs/tags");
    fs.writeFileSync(
      ".savit/refs/heads/main.txt",
      "pointer to latest commit on main branch, which should be null on init"
    );
  } catch (err: any) {
    if (err.message.split(",")[0] === "EEXIST: file already exists") {
      console.log("Savit Folder already exists");
    } else {
      console.log(err);
    }
  }
}

export default createSavitFolder;
