-- Create a table to store document rows for tabular data
CREATE TABLE IF NOT EXISTS document_rows (
    id SERIAL PRIMARY KEY,
    dataset_id TEXT REFERENCES document_metadata(id),
    row_data JSONB  -- Store the actual row data
);
