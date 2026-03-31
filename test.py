# import duckdb

# # Connect to an in-memory database
# con = duckdb.connect()

# # Query the raw data parquet file
# query = """
# SELECT *
# FROM read_parquet('public/data/nirf_scores.parquet') limit 20;
# """

# # Execute and show results
# print(con.execute(query).df())










import duckdb

# Connect to an in-memory database
con = duckdb.connect()

# Use the COPY command to export directly to a CSV file
# This is much faster for large datasets
query = """
COPY (
    SELECT ranking_year, category, institute_name, img_ss_score, pdf_total_intake
FROM read_parquet('public/data/nirf_scores.parquet')
WHERE institute_name LIKE '%Indian Institute of Science%'
ORDER BY ranking_year DESC
) TO 'output_results.csv' (HEADER, DELIMITER ',');
"""

con.execute(query)
print("Data successfully saved to output_results.csv")