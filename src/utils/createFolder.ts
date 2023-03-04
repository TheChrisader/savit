import fs from "fs";

function createSavitFolder(path: string = "") {
  if (path) {
    path = path + "/";
  }
  try {
    fs.mkdirSync(path + ".savit");
    fs.writeFileSync(path + ".savit/HEAD.txt", "null");
    fs.writeFileSync(path + ".savit/index.txt", "");
    fs.mkdirSync(path + ".savit/objects");
    fs.mkdirSync(path + ".savit/refs");
    fs.mkdirSync(path + ".savit/refs/heads");
    fs.mkdirSync(path + ".savit/refs/tags");
    fs.writeFileSync(
      path + ".savit/refs/heads/main.txt",
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
