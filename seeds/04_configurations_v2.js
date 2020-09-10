const configurations = [
  {
    type: "templates",
    name: "Agency template",
    sort_order: 0,
    content: {
      name: "Agency template",
      settings: [
        {
          sheetName: "Projects",
          tableName: "Projects",
          columns: [
            "Project Name",
            "Project Identification Number",
            "Description",
            "CRF Amount Allocated",
            "Status",
            "Contact Name",
            "Contact Email",
            "Naming Convention"
          ]
        },
        {
          sheetName: "Subrecipient",
          tableName: "Subrecipient",
          columns: [
            "Identification Number",
            "Legal Name",
            "Address Line 1",
            "Address Line 2",
            "Address Line 3",
            "City Name",
            "State Code",
            "Zip",
            "Country Name",
            "Organization Type"
          ]
        },
        {
          sheetName: "Contracts",
          tableName: "Contracts",
          columns: [
            "Subrecipient Organization Name",
            "Contract Number",
            "Contract Type",
            "Contract Amount",
            "Contract Date ",
            "Period of Performance Start Date ",
            "Period of Performance End Date ",
            "Primary Place of Performance Address Line 1 ",
            "Primary Place of Performance Address Line 2",
            "Primary Place of Performance Address Line 3",
            "Primary Place of Performance City Name ",
            "Primary Place of Performance State Code ",
            "Primary Place of Performance Zip",
            "Primary Place of Performance Country Name ",
            "Primary Place of Performance Congressional District ",
            "Contract Description ",
            "Project ID",
            "Current Quarter Obligation",
            "Expenditure Start Date",
            "Expenditure End Date",
            "Total Expenditure Amount",
            "Budgeted Personnel and Services Diverted to a Substantially Different Use",
            "COVID-19 Testing and Contact Tracing",
            "Economic Support (Other than Small Business, Housing, and Food Assistance)",
            "Facilitating Distance Learning",
            "Food Programs",
            "Housing Support",
            "Improve Telework Capabilities of Public Employees",
            "Medical Expenses",
            "Nursing Home Assistance",
            "Payroll for Public Health and Safety Employees",
            "Personal Protective Equipment",
            "Public Health Expenses",
            "Small Business Assistance",
            "Unemployment Benefits",
            "Workers’ Compensation",
            "Expenses Associated with the Issuance of Tax Anticipation Notes",
            "Administrative Expenses",
            "Other Expenditure Categories",
            "Other Expenditure Amount"
          ]
        },
        {
          sheetName: "Grants",
          tableName: "Grants",
          columns: [
            "Subrecipient Organization Name",
            "Award Number",
            "Award Payment Method",
            "Award Amount",
            "Award Date ",
            "Period of Performance Start Date ",
            "Period of Performance End Date ",
            "Awardee Primary Place of Performance Address Line 1 ",
            "Awardee Primary Place of Performance Address Line 2",
            "Awardee Primary Place of Performance Address Line 3",
            "Primary Place of Performance City Name ",
            "Primary Place of Performance State Code ",
            "Primary Place of Performance Zip",
            "Primary Place of Performance Country Name",
            "Primary Place of Performance Congressional District ",
            "Award Description ",
            "Compliance ",
            "Compliance explanation",
            "Project ID",
            "Current Quarter Obligation",
            "Expenditure Start Date",
            "Expenditure End Date",
            "Total Expenditure Amount",
            "Budgeted Personnel and Services Diverted to a Substantially Different Use",
            "COVID-19 Testing and Contact Tracing",
            "Economic Support (Other than Small Business, Housing, and Food Assistance)",
            "Facilitating Distance Learning",
            "Food Programs",
            "Housing Support",
            "Improve Telework Capabilities of Public Employees",
            "Medical Expenses",
            "Nursing Home Assistance",
            "Payroll for Public Health and Safety Employees",
            "Personal Protective Equipment",
            "Public Health Expenses",
            "Small Business Assistance",
            "Unemployment Benefits",
            "Workers’ Compensation",
            "Expenses Associated with the Issuance of Tax Anticipation Notes",
            "Administrative Expenses",
            "Other Expenditure Categories",
            "Other Expenditure Amount"
          ]
        },
        {
          sheetName: "Loans",
          tableName: "Loans",
          columns: [
            "Subrecipient Organization (Borrower)",
            "Loan Number",
            "Loan Amount",
            "Loan Date",
            "Loan Expiration Date",
            "Primary Place of Performance Address Line 1",
            "Primary Place of Performance Address Line 2",
            "Primary Place of Performance Address Line 3",
            "Primary Place of Performance City Name",
            "Primary Place of Performance State Code",
            "Primary Place of Performance Zip",
            "Primary Place of Performance Country Name",
            "Primary Place of Performance Congressional District ",
            "Loan Description",
            "Current Quarter Obligation",
            "Project ID",
            "Payment Date",
            "Total Payment Amount",
            "Will these payments be repurposed for Future Use?",
            "Budgeted Personnel and Services Diverted to a Substantially Different Use",
            "COVID-19 Testing and Contact Tracing",
            "Economic Support (Other than Small Business, Housing, and Food Assistance)",
            "Facilitating Distance Learning",
            "Food Programs",
            "Housing Support",
            "Improve Telework Capabilities of Public Employees",
            "Medical Expenses",
            "Nursing Home Assistance",
            "Payroll for Public Health and Safety Employees",
            "Personal Protective Equipment",
            "Public Health Expenses",
            "Small Business Assistance",
            "Unemployment Benefits",
            "Workers’ Compensation",
            "Expenses Associated with the Issuance of Tax Anticipation Notes",
            "Administrative Expenses",
            "Other Expenditure Categories",
            "Other Expenditure Amount"
          ]
        },
        {
          sheetName: "Transfers",
          tableName: "Transfers",
          columns: [
            "Subrecipient Organization (Transferee/Government Unit)",
            "Transfer Number ",
            "Transfer Amount ",
            "Transfer Date ",
            "Transfer Type ",
            "Purpose Description ",
            "Project ID",
            "Current Quarter Obligation",
            "Expenditure Start Date",
            "Expenditure End Date",
            "Total Expenditure Amount",
            "Budgeted Personnel and Services Diverted to a Substantially Different Use",
            "COVID-19 Testing and Contact Tracing",
            "Economic Support (Other than Small Business, Housing, and Food Assistance)",
            "Facilitating Distance Learning",
            "Food Programs",
            "Housing Support",
            "Improve Telework Capabilities of Public Employees",
            "Medical Expenses",
            "Nursing Home Assistance",
            "Payroll for Public Health and Safety Employees",
            "Personal Protective Equipment",
            "Public Health Expenses",
            "Small Business Assistance",
            "Unemployment Benefits",
            "Workers’ Compensation",
            "Expenses Associated with the Issuance of Tax Anticipation Notes",
            "Administrative Expenses",
            "Other Expenditure Categories",
            "Other Expenditure Amount"
          ]
        },
        {
          sheetName: "Direct",
          tableName: "Direct",
          columns: [
            "Subrecipient Organization",
            "Obligation Amount",
            "Obligation Date ",
            "Project ID",
            "Current Quarter Obligation",
            "Expenditure Start Date",
            "Expenditure End Date",
            "Total Expenditure Amount",
            "Budgeted Personnel and Services Diverted to a Substantially Different Use",
            "COVID-19 Testing and Contact Tracing",
            "Economic Support (Other than Small Business, Housing, and Food Assistance)",
            "Facilitating Distance Learning",
            "Food Programs",
            "Housing Support",
            "Improve Telework Capabilities of Public Employees",
            "Medical Expenses",
            "Nursing Home Assistance",
            "Payroll for Public Health and Safety Employees",
            "Personal Protective Equipment",
            "Public Health Expenses",
            "Small Business Assistance",
            "Unemployment Benefits",
            "Workers’ Compensation",
            "Expenses Associated with the Issuance of Tax Anticipation Notes",
            "Administrative Expenses",
            "Other Expenditure Categories",
            "Other Expenditure Amount"
          ]
        },
        {
          sheetName: "Aggregate Awards < 50000",
          tableName: "Aggregate Awards < 50000",
          columns: [
            "Funding Type",
            "Updates this Quarter?",
            "Current Quarter Obligation",
            "Current Quarter Expenditure/Payments"
          ]
        },
        {
          sheetName: "Aggregate Payments Individual",
          tableName: "Aggregate Payments Individual",
          columns: [
            "Updates this Quarter?",
            "Current Quarter Obligation",
            "Current Quarter Expenditure"
          ]
        }
      ]
    }
  },
  {
    type: "tables",
    name: "Subrecipient",
    sort_order: 1,
    content: {
      name: "Subrecipient",
      columns: [
        { name: "Identification Number" },
        { name: "Legal Name" },
        { name: "Address Line 1" },
        { name: "Address Line 2" },
        { name: "Address Line 3" },
        { name: "City Name" },
        { name: "State Code" },
        { name: "Zip" },
        { name: "Country Name" },
        { name: "Organization Type" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "Grants",
    sort_order: 3,
    content: {
      name: "Grants",
      columns: [
        { name: "Subrecipient Organization Name" },
        { name: "Award Number" },
        { name: "Award Payment Method" },
        { name: "Award Amount" },
        { name: "Award Date " },
        { name: "Period of Performance Start Date " },
        { name: "Period of Performance End Date " },
        { name: "Awardee Primary Place of Performance Address Line 1 " },
        { name: "Awardee Primary Place of Performance Address Line 2" },
        { name: "Awardee Primary Place of Performance Address Line 3" },
        { name: "Primary Place of Performance City Name " },
        { name: "Primary Place of Performance State Code " },
        { name: "Primary Place of Performance Zip" },
        { name: "Primary Place of Performance Country Name" },
        { name: "Primary Place of Performance Congressional District " },
        { name: "Award Description " },
        { name: "Compliance " },
        { name: "Compliance explanation" },
        { name: "Project ID" },
        { name: "Current Quarter Obligation" },
        { name: "Expenditure Start Date" },
        { name: "Expenditure End Date" },
        { name: "Total Expenditure Amount" },
        {
          name:
            "Budgeted Personnel and Services Diverted to a Substantially Different Use"
        },
        { name: "COVID-19 Testing and Contact Tracing" },
        {
          name:
            "Economic Support (Other than Small Business, Housing, and Food Assistance)"
        },
        { name: "Facilitating Distance Learning" },
        { name: "Food Programs" },
        { name: "Housing Support" },
        { name: "Improve Telework Capabilities of Public Employees" },
        { name: "Medical Expenses" },
        { name: "Nursing Home Assistance" },
        { name: "Payroll for Public Health and Safety Employees" },
        { name: "Personal Protective Equipment" },
        { name: "Public Health Expenses" },
        { name: "Small Business Assistance" },
        { name: "Unemployment Benefits" },
        { name: "Workers’ Compensation" },
        {
          name:
            "Expenses Associated with the Issuance of Tax Anticipation Notes"
        },
        { name: "Administrative Expenses" },
        { name: "Other Expenditure Categories" },
        { name: "Other Expenditure Amount" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "Transfers",
    sort_order: 5,
    content: {
      name: "Transfers",
      columns: [
        { name: "Subrecipient Organization (Transferee/Government Unit)" },
        { name: "Transfer Number " },
        { name: "Transfer Amount " },
        { name: "Transfer Date " },
        { name: "Transfer Type " },
        { name: "Purpose Description " },
        { name: "Project ID" },
        { name: "Current Quarter Obligation" },
        { name: "Expenditure Start Date" },
        { name: "Expenditure End Date" },
        { name: "Total Expenditure Amount" },
        {
          name:
            "Budgeted Personnel and Services Diverted to a Substantially Different Use"
        },
        { name: "COVID-19 Testing and Contact Tracing" },
        {
          name:
            "Economic Support (Other than Small Business, Housing, and Food Assistance)"
        },
        { name: "Facilitating Distance Learning" },
        { name: "Food Programs" },
        { name: "Housing Support" },
        { name: "Improve Telework Capabilities of Public Employees" },
        { name: "Medical Expenses" },
        { name: "Nursing Home Assistance" },
        { name: "Payroll for Public Health and Safety Employees" },
        { name: "Personal Protective Equipment" },
        { name: "Public Health Expenses" },
        { name: "Small Business Assistance" },
        { name: "Unemployment Benefits" },
        { name: "Workers’ Compensation" },
        {
          name:
            "Expenses Associated with the Issuance of Tax Anticipation Notes"
        },
        { name: "Administrative Expenses" },
        { name: "Other Expenditure Categories" },
        { name: "Other Expenditure Amount" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "Contracts",
    sort_order: 2,
    content: {
      name: "Contracts",
      columns: [
        { name: "Subrecipient Organization Name" },
        { name: "Contract Number" },
        { name: "Contract Type" },
        { name: "Contract Amount" },
        { name: "Contract Date " },
        { name: "Period of Performance Start Date " },
        { name: "Period of Performance End Date " },
        { name: "Primary Place of Performance Address Line 1 " },
        { name: "Primary Place of Performance Address Line 2" },
        { name: "Primary Place of Performance Address Line 3" },
        { name: "Primary Place of Performance City Name " },
        { name: "Primary Place of Performance State Code " },
        { name: "Primary Place of Performance Zip" },
        { name: "Primary Place of Performance Country Name " },
        { name: "Primary Place of Performance Congressional District " },
        { name: "Contract Description " },
        { name: "Project ID" },
        { name: "Current Quarter Obligation" },
        { name: "Expenditure Start Date" },
        { name: "Expenditure End Date" },
        { name: "Total Expenditure Amount" },
        {
          name:
            "Budgeted Personnel and Services Diverted to a Substantially Different Use"
        },
        { name: "COVID-19 Testing and Contact Tracing" },
        {
          name:
            "Economic Support (Other than Small Business, Housing, and Food Assistance)"
        },
        { name: "Facilitating Distance Learning" },
        { name: "Food Programs" },
        { name: "Housing Support" },
        { name: "Improve Telework Capabilities of Public Employees" },
        { name: "Medical Expenses" },
        { name: "Nursing Home Assistance" },
        { name: "Payroll for Public Health and Safety Employees" },
        { name: "Personal Protective Equipment" },
        { name: "Public Health Expenses" },
        { name: "Small Business Assistance" },
        { name: "Unemployment Benefits" },
        { name: "Workers’ Compensation" },
        {
          name:
            "Expenses Associated with the Issuance of Tax Anticipation Notes"
        },
        { name: "Administrative Expenses" },
        { name: "Other Expenditure Categories" },
        { name: "Other Expenditure Amount" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "Loans",
    sort_order: 4,
    content: {
      name: "Loans",
      columns: [
        { name: "Subrecipient Organization (Borrower)" },
        { name: "Loan Number" },
        { name: "Loan Amount" },
        { name: "Loan Date" },
        { name: "Loan Expiration Date" },
        { name: "Primary Place of Performance Address Line 1" },
        { name: "Primary Place of Performance Address Line 2" },
        { name: "Primary Place of Performance Address Line 3" },
        { name: "Primary Place of Performance City Name" },
        { name: "Primary Place of Performance State Code" },
        { name: "Primary Place of Performance Zip" },
        { name: "Primary Place of Performance Country Name" },
        { name: "Primary Place of Performance Congressional District " },
        { name: "Loan Description" },
        { name: "Current Quarter Obligation" },
        { name: "Project ID" },
        { name: "Payment Date" },
        { name: "Total Payment Amount" },
        { name: "Will these payments be repurposed for Future Use?" },
        {
          name:
            "Budgeted Personnel and Services Diverted to a Substantially Different Use"
        },
        { name: "COVID-19 Testing and Contact Tracing" },
        {
          name:
            "Economic Support (Other than Small Business, Housing, and Food Assistance)"
        },
        { name: "Facilitating Distance Learning" },
        { name: "Food Programs" },
        { name: "Housing Support" },
        { name: "Improve Telework Capabilities of Public Employees" },
        { name: "Medical Expenses" },
        { name: "Nursing Home Assistance" },
        { name: "Payroll for Public Health and Safety Employees" },
        { name: "Personal Protective Equipment" },
        { name: "Public Health Expenses" },
        { name: "Small Business Assistance" },
        { name: "Unemployment Benefits" },
        { name: "Workers’ Compensation" },
        {
          name:
            "Expenses Associated with the Issuance of Tax Anticipation Notes"
        },
        { name: "Administrative Expenses" },
        { name: "Other Expenditure Categories" },
        { name: "Other Expenditure Amount" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "Aggregate Awards < 50000",
    sort_order: 7,
    content: {
      name: "Aggregate Awards < 50000",
      columns: [
        { name: "Funding Type" },
        { name: "Updates this Quarter?" },
        { name: "Current Quarter Obligation" },
        { name: "Current Quarter Expenditure/Payments" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "Aggregate Payments Individual",
    sort_order: 8,
    content: {
      name: "Aggregate Payments Individual",
      columns: [
        { name: "Updates this Quarter?" },
        { name: "Current Quarter Obligation" },
        { name: "Current Quarter Expenditure" }
      ],
      relations: []
    }
  },
  {
    type: "tables",
    name: "Direct",
    sort_order: 6,
    content: {
      name: "Direct",
      columns: [
        { name: "Subrecipient Organization" },
        { name: "Obligation Amount" },
        { name: "Obligation Date " },
        { name: "Project ID" },
        { name: "Current Quarter Obligation" },
        { name: "Expenditure Start Date" },
        { name: "Expenditure End Date" },
        { name: "Total Expenditure Amount" },
        {
          name:
            "Budgeted Personnel and Services Diverted to a Substantially Different Use"
        },
        { name: "COVID-19 Testing and Contact Tracing" },
        {
          name:
            "Economic Support (Other than Small Business, Housing, and Food Assistance)"
        },
        { name: "Facilitating Distance Learning" },
        { name: "Food Programs" },
        { name: "Housing Support" },
        { name: "Improve Telework Capabilities of Public Employees" },
        { name: "Medical Expenses" },
        { name: "Nursing Home Assistance" },
        { name: "Payroll for Public Health and Safety Employees" },
        { name: "Personal Protective Equipment" },
        { name: "Public Health Expenses" },
        { name: "Small Business Assistance" },
        { name: "Unemployment Benefits" },
        { name: "Workers’ Compensation" },
        {
          name:
            "Expenses Associated with the Issuance of Tax Anticipation Notes"
        },
        { name: "Administrative Expenses" },
        { name: "Other Expenditure Categories" },
        { name: "Other Expenditure Amount" }
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
