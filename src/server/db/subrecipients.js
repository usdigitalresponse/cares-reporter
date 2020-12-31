/* migration file for subrecipients table:
    migrations/20201204142859_add_subrecipients_table.js

    .createTable("subrecipients", function(table) {
      table.increments("id").primary();
      table.text("identification_number").notNullable().unique();
      table.text("duns_number").unique();
      table.text("legal_name").notNullable().unique();
      table.text("address_line_1").notNullable();
      table.text("address_line_2");
      table.text("address_line_3");
      table.text("city_name").notNullable();
      table.text("state_code");
      table.text("zip");
      table.text("country_name").notNullable().defaultTo("United States");
      table.text("organization_type").notNullable().defaultTo("Other");
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    });
  */
const knex = require("./connection");

async function getSubRecipients() {
  let records = await knex("subrecipients")
    .select("*");

  return records.map(record => respace(record));
}

async function setSubRecipient( record ) {
  record = despace(record);
  console.log(`Writing subrecipient record ID "${record.identification_number}"`);

  try{
    await knex("subrecipients").insert(record);
    // let result = await knex("subrecipients").insert(record);
    // console.dir(result);

  } catch (err) {
    console.dir(err);
  }
  return ;
}

/* despace() replaces spaces with underscores in an object's keys
  */
function despace(obj) {
  let keys = Object.keys(obj);
  let _keys = keys.map( key => key.trim().replace(/ /g,"_"));
  let _obj = {};
  keys.forEach((k,i) => _obj[_keys[i]] = obj[keys[i]]);
  return _obj;
}

/* respace() replaces underscores with spaces in an object's keys
  */
function respace(_obj) {
  let _keys = Object.keys(_obj);
  let keys = _keys.map( _key => _key.replace(/_/g," "));
  let obj = {};
  _keys.forEach((k,i) => obj[keys[i]] = _obj[_keys[i]]);
  return obj;
}

module.exports = {
  getSubRecipients,
  setSubRecipient
};

/*                                 *  *  *                                    */
