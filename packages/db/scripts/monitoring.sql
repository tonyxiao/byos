-- TODO: Create a view out of this

WITH runs AS (
  SELECT
    ROW_NUMBER() OVER (PARTITION BY sr.customer_id,
      sr.provider_name ORDER BY sr.started_at DESC) AS rn,
    ss.customer_id,
    ss.provider_name,
    sr.id AS run_id,
    sr.metrics,
    sr.status,
    duration,
    error
  FROM
    sync_state ss
  LEFT JOIN sync_run sr ON ss.customer_id = sr.customer_id
    AND ss.provider_name = sr.provider_name
)
SELECT
  *
FROM
  runs
WHERE
  rn = 1;