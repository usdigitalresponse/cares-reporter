require("dotenv").config();

exports.seed = async function(knex) {
  await knex("reporting_periods").del();
  await knex("reporting_periods").insert([
    {
      name: "1",
      start_date: "2020-03-01",
      end_date: "2020-09-30",
      period_of_performance_end_date: "2020-12-30",
      open_date:"2020-12-01",
      close_date:"2020-12-01",
      review_period_start_date:"2020-12-16",
      review_period_end_date:"2020-12-23",
      crf_end_date:"2021-09-30"
    },
    {
      name: "2",
      start_date: "2020-03-01",
      end_date: "2020-09-30",
      period_of_performance_end_date: "2020-12-30",
      open_date:"2020-12-01",
      close_date:"2020-12-01",
      review_period_start_date:"2020-12-16",
      review_period_end_date:"2020-12-23",
      crf_end_date:"2021-09-30"
    },
    {
      name: "3",
      start_date: "2020-10-01",
      end_date: "2020-12-31",
      period_of_performance_end_date: "2020-12-30",
      open_date:"2020-12-25",
      close_date:"2021-01-11",
      review_period_start_date:"2021-01-12",
      review_period_end_date:"2021-01-20",
      crf_end_date:"2021-09-30"
    },
    {
      name: "4",
      start_date: "2021-01-01",
      end_date: "2021-03-31",
      period_of_performance_end_date: "2020-12-30",
      open_date:"2021-01-22",
      close_date:"2021-04-12",
      review_period_start_date:"2021-04-13",
      review_period_end_date:"2021-04-20",
      crf_end_date:"2021-09-30"
    },
    {
      name: "5",
      start_date: "2021-04-01",
      end_date: "2021-06-30",
      period_of_performance_end_date: "2020-12-30",
      open_date:"2021-04-22",
      close_date:"2021-07-12",
      review_period_start_date:"2021-07-13",
      review_period_end_date:"2021-07-20",
      crf_end_date:"2021-09-30"
    },
    {
      name: "6",
      start_date: "2021-07-01",
      end_date: "2021-09-30",
      period_of_performance_end_date: "2020-12-30",
      open_date:"2021-07-22",
      close_date:"2021-10-12",
      review_period_start_date:"2021-10-13",
      review_period_end_date:"2021-10-20",
      crf_end_date:"2021-09-30"
    }
  ])
    .returning("id");
};
