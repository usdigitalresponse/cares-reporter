const configurations = [
  {
    type: "templates",
    name: "Agency Template",
    sort_order: 0,
    content: {
      name: "Agency template",
      settings: [
        {
          sheetName: "Projects",
          tableName: "projects",
          columns: [
            "name",
            "identification_number",
            "description",
            "status_of_completion",
            "contact_name",
            "contact_email",
            "amount_allocated"
          ]
        },
        {
          sheetName: "SubRecipients",
          tableName: "subrecipients",
          columns: [
            "subrecipient_duns",
            "subrecipient_id",
            "legal_name",
            "address_1",
            "address_2",
            "address_3",
            "city",
            "state",
            "country",
            "zip",
            "zip_plus_four",
            "organization_type"
          ]
        },
        {
          sheetName: "Contracts",
          tableName: "contracts",
          columns: [
            "contract_number",
            "project_id",
            "subrecipient",
            "subrecipient_id",
            "description",
            "type",
            "amount",
            "date"
          ]
        }
      ]
    }
  },
  {
    type: "tables",
    name: "subrecipients",
    sort_order: 1,
    content: {
      name: "subrecipients",
      columns: [
        { name: "id", generated: true, primaryKey: true },
        { name: "legal_name", required: true },
        { name: "subrecipient_id" },
        { name: "subrecipient_duns" },
        { name: "organization_type" },
        { name: "address_1" },
        { name: "address_2" },
        { name: "address_3" },
        { name: "city" },
        { name: "state" },
        { name: "country" },
        { name: "zip" },
        { name: "zip_plus_four" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "contracts",
    sort_order: 2,
    content: {
      name: "contracts",
      columns: [
        { name: "id", generated: true, primaryKey: true },
        { name: "name", required: true },
        { name: "contract_number" },
        {
          name: "project_id",
          label: "Project",
          required: true,
          foreignKey: { table: "projects", show: "name" }
        },
        { name: "subrecipient" },
        { name: "subrecipient_id" },
        { name: "description" },
        { name: "type" },
        { name: "amount", format: "0,0" },
        { name: "date" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "projects",
    sort_order: 3,
    content: {
      name: "projects",
      columns: [
        { name: "id", generated: true, primaryKey: true },
        { name: "name", required: true },
        { name: "identification_number" },
        { name: "description", rows: 10 },
        { name: "contact_name" },
        { name: "status_of_completion" },
        { name: "contact_email" },
        { name: "amount_allocated", numeric: true, format: "0,0" }
      ],
      views: [
        {
          name: "Id and Description",
          columns: ["id", "name", "identification_number", "description"]
        },
        {
          name: "Group by Status of Completion",
          groupBy: "status_of_completion"
        },
        { name: "Group by Contact Name", groupBy: "contact_name" }
      ],
      relations: []
    }
  }
];

exports.seed = function(knex) {
  // Deletes ALL existing configurations
  configurations.forEach(
    config => (config.content = JSON.stringify(config.content))
  );
  return knex("configurations")
    .del()
    .then(function() {
      // Inserts seed entries
      return knex("configurations").insert(configurations);
    });
};
