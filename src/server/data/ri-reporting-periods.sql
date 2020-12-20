
--
-- Data for Name: reporting_periods; Type: TABLE DATA; Schema: public;
--
delete from reporting_periods where id>1;
COPY public.reporting_periods (id, name, start_date, end_date, period_of_performance_end_date, certified_at, certified_by, reporting_template, validation_rule_tags, open_date, close_date, review_period_start_date, review_period_end_date, final_report_file) FROM stdin;
2	December, 2020	2020-10-01	2020-12-31	2020-12-30	\N	\N	RICRF Reporting Workbook v2.xlsx	\N	2020-12-25	2021-01-11	2021-01-12	2021-01-20	\N
3	March, 2021	2021-01-01	2021-03-31	2020-12-30	\N	\N	RICRF Reporting Workbook v2.xlsx	\N	2021-01-22	2021-04-12	2021-04-13	2021-04-20	\N
4	June, 2021	2021-04-01	2021-06-30	2020-12-30	\N	\N	RICRF Reporting Workbook v2.xlsx	\N	2021-04-22	2021-07-12	2021-07-13	2021-07-20	\N
5	September, 2021	2021-07-01	2021-09-30	2020-12-30	\N	\N	RICRF Reporting Workbook v2.xlsx	\N	2021-07-22	2021-10-12	2021-10-13	2021-10-20	\N
\.
