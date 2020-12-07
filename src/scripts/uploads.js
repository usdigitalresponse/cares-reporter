const knex = require("../server/db/connection");
const _ = require("lodash");

function documentsFromFile(filename) {
  return knex("documents")
    .select("documents.*", "uploads.filename")
    .join("uploads", { "documents.upload_id": "uploads.id" })
    .where("filename", filename);
}

async function run(filenames) {
  for(let n=0; n<filenames.length; n++) {
    let numberOfDuplicates = 0;
    const filename = filenames[n];
    console.log(filename);
    const documents = await documentsFromFile(filename);
    if (documents.length > 0) {
      const upload_id = documents[0]["upload_id"];
      console.log("upload_id:", upload_id);
      const groups = _.groupBy(documents, 'type');
      _.each(groups, (values, key) => {
        console.log(key, values.length);
      });
      const subrecipients = _.groupBy(groups.subrecipient, "content.identification number");
      _.each(subrecipients, (values, key) => {
        const value = values[0];
        const content = value.content;
        const ids = _.map(values, 'id');
        if (values.length > 1) {
          ++numberOfDuplicates;
        }
        console.log(value.id, content["identification number"], content["legal name"], ids, values.length > 1 ? " ***DUPLICATE***" : "");
      });
      console.log(upload_id, filename, "Number of duplicates:", numberOfDuplicates);
    } else {
      console.log(filename, "is empty");
    }
  }
}

const filenames = process.argv.slice(2);
run(filenames).then(() => knex.destroy());
