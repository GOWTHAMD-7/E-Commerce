-- UPDATE PRODUCT VIEW COUNT SQL
-- Sets realistic random view_count (between 50 and 2500 views) for all existing products in PostgreSQL database
UPDATE product SET view_count = floor(random() * 2450 + 50)::bigint WHERE view_count IS NULL OR view_count = 0;
