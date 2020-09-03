const { user, createUpload } = require("../db");
const { validateFilename } = require("./validate_upload");
const FileInterface = require("../lib/server_disk_interface");
const { ValidationLog } = require("../lib/validation_log");
const fileInterface = new FileInterface();

const processUpload = async ({
  filename,
  configuration_id,
  user_id,
  agency_id,
  data
}) => {
  const valog = new ValidationLog();
  valog.append(validateFilename(filename));
  if (!valog.success()) {
    return { valog, upload: {} };
  }
  await fileInterface.writeFile(filename, data);
  const current_user = await user(user_id);
  const upload = await createUpload({
    filename,
    configuration_id,
    created_by: current_user.email,
    user_id,
    agency_id
  });
  return { valog, upload };
};

module.exports = { processUpload };
