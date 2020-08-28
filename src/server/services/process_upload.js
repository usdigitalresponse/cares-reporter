const { user, createUpload } = require("../db");
const FileInterface = require("../lib/serverDiskInterface");
const fileInterface = new FileInterface();

const processUpload = async ({ filename, configuration_id, user_id, data }) => {
  await fileInterface.writeFile(filename, data);
  const currentUser = await user(user_id);
  return createUpload({
    filename,
    configuration_id,
    created_by: currentUser.email
  });
};

module.exports = { processUpload };
