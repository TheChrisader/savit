import crypto from "crypto";

const sha1Hash = (file: string) => {
  return crypto.createHash("sha1").update(file).digest("hex");
};

export default sha1Hash;
