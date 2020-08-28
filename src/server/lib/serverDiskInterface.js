const fs = require("fs").promises;
const path = require("path");
const multer = require("multer");

class ServerDiskInterface {
  constructor(uploadDirectory = process.env.UPLOAD_DIRECTORY) {
    this.uploadDirectory = uploadDirectory;
  }

  upload() {
    return multer({ dest: this.uploadDirectory });
  }

  async listFiles() {
    return fs.readdir(this.uploadDirectory);
  }

  async readFile(fname) {
    return fs.readFile(path.join(this.uploadDirectory, fname));
  }

  async writeFile(fname, data) {
    return fs.writeFile(path.join(this.uploadDirectory, fname), data);
  }

  async rmFile(fname) {
    return fs.unlink(path.join(this.uploadDirectory, fname));
  }
}

module.exports = ServerDiskInterface;
