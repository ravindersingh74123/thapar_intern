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









# import duckdb

# con = duckdb.connect()

# query = """
# COPY (
#     SELECT category, ranking_year, img_nirf_score, img_nirf_rank
#     FROM read_parquet('public/data/nirf_scores.parquet')
#     WHERE img_nirf_score IS NOT NULL
#     LIMIT 10
# ) TO 'check_rankings.csv' (HEADER, DELIMITER ',');
# """

# con.execute(query)
# print("Saved to check_rankings.csv")







# import pandas as pd

# df = pd.read_parquet('public/data/nirf_scores.parquet')

# print("Before - columns with nirf/total:", [c for c in df.columns if 'nirf' in c or c == 'img_total'])

# # Coalesce nirf_score
# df['nirf_score'] = df.get('nirf_score_x', pd.Series(dtype=float)).combine_first(
#                    df.get('nirf_score_y', pd.Series(dtype=float)))

# # Coalesce nirf_rank  
# df['nirf_rank'] = df.get('nirf_rank_x', pd.Series(dtype=float)).combine_first(
#                   df.get('nirf_rank_y', pd.Series(dtype=float)))

# # Add img_total = nirf_score so existing detail page code works
# df['img_total'] = df['nirf_score']

# # Drop the _x/_y duplicates
# df = df.drop(columns=[c for c in ['nirf_score_x','nirf_score_y','nirf_rank_x','nirf_rank_y'] if c in df.columns])

# print("After:", [c for c in df.columns if 'nirf' in c or c == 'img_total'])
# print("nirf_score non-null:", df['nirf_score'].notna().sum())
# print("img_total non-null:", df['img_total'].notna().sum())

# df.to_parquet('public/data/nirf_scores.parquet', engine='pyarrow', compression='snappy', index=False)
# print("Saved!")

import duckdb

con = duckdb.connect()

con.execute("""
COPY (
    SELECT category, ranking_year, nirf_score, nirf_rank, img_total, institute_name
    FROM read_parquet('public/data/nirf_scores.parquet')
    WHERE institute_name LIKE '%Indian Institute Of Technology Roorkee%'
    AND ranking_year = 2025
    AND category = 'Overall'
    LIMIT 2
) TO 'check_roorkee2.csv' (HEADER, DELIMITER ',');
""")
print("Done")