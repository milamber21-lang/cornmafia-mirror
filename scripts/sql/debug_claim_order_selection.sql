-- FILE: scripts/sql/debug_claim_order_selection.sql
-- Language: SQL
-- Purpose: EXACTLY mimic Step-3 selection logic (head detection, chain walk, furthest finished prefix,
--          wrap-around for next K). Use this to debug which landPlotIds the worker will fetch next.
-- Tables (snake_case as per Payload default):
--   claim_orders(land_plot_id BIGINT, next_land_plot_id BIGINT, ...)
--   claim_progress(land_plot_id BIGINT, finished BOOLEAN, ...)

WITH RECURSIVE
params AS (
  -- Change K here to preview a different window size
  SELECT 10::int AS k
),
edges AS (
  SELECT
    co.land_plot_id::bigint      AS land_plot_id,
    co.next_land_plot_id::bigint AS next_land_plot_id
  FROM claim_orders co
),
heads AS (
  -- nodes that never appear as "next" are heads
  SELECT e.land_plot_id
  FROM edges e
  LEFT JOIN edges r
    ON e.land_plot_id = r.next_land_plot_id
  WHERE r.land_plot_id IS NULL
),
start_node AS (
  -- choose deterministic start:
  -- if there are heads, pick the smallest head; otherwise pick smallest id in graph (cycle case)
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM heads) THEN (SELECT MIN(land_plot_id) FROM heads)
    ELSE (SELECT MIN(land_plot_id) FROM edges)
  END AS land_plot_id
),
-- Walk the chain from start_node via next pointers. Stop on NULL or first cycle.
chain AS (
  -- base
  SELECT
    e.land_plot_id,
    e.next_land_plot_id,
    1 AS pos,
    ARRAY[e.land_plot_id] AS path
  FROM edges e
  JOIN start_node s ON e.land_plot_id = s.land_plot_id

  UNION ALL

  -- recursive step
  SELECT
    e.land_plot_id,
    e.next_land_plot_id,
    c.pos + 1 AS pos,
    c.path || e.land_plot_id
  FROM chain c
  JOIN edges e ON e.land_plot_id = c.next_land_plot_id
  WHERE NOT e.land_plot_id = ANY (c.path) -- prevent infinite loop on cycles
),
order_list AS (
  SELECT land_plot_id, next_land_plot_id, pos
  FROM chain
  ORDER BY pos
),
-- annotate with finished flags; missing rows -> NOT finished
progress AS (
  SELECT
    ol.land_plot_id,
    COALESCE(cp.finished, FALSE) AS finished
  FROM order_list ol
  LEFT JOIN claim_progress cp ON cp.land_plot_id = ol.land_plot_id
),
annotated AS (
  SELECT
    ol.pos,
    ol.land_plot_id,
    ol.next_land_plot_id,
    p.finished,
    SUM(CASE WHEN p.finished THEN 0 ELSE 1 END) OVER (ORDER BY ol.pos) AS cum_unfinished
  FROM order_list ol
  JOIN progress p USING (land_plot_id)
),
furthest AS (
  -- "furthestFinishedIndex": largest position where the prefix is fully finished (cum_unfinished = 0)
  SELECT COALESCE(MAX(pos), 0) AS furthest_pos
  FROM annotated
  WHERE cum_unfinished = 0
),
upcoming_base AS (
  -- immediate next items after the furthest finished position
  SELECT a.*
  FROM annotated a, furthest f
  WHERE a.pos > f.furthest_pos
  ORDER BY a.pos
  LIMIT (SELECT k FROM params)
),
need AS (
  -- how many more we need to reach K (wrap-around)
  SELECT (SELECT k FROM params) - COUNT(*) AS need
  FROM upcoming_base
),
upcoming_wrap AS (
  SELECT a.*
  FROM annotated a, need
  WHERE need.need > 0
  ORDER BY a.pos
  LIMIT (SELECT need FROM need)
),
upcoming AS (
  SELECT * FROM upcoming_base
  UNION ALL
  SELECT * FROM upcoming_wrap
),
indexed_upcoming AS (
  SELECT
    u.land_plot_id,
    ROW_NUMBER() OVER (ORDER BY u.pos) AS upcoming_index
  FROM upcoming u
)
SELECT
  a.pos,
  a.land_plot_id,
  a.next_land_plot_id,
  a.finished,
  a.cum_unfinished,
  f.furthest_pos,
  iu.upcoming_index  -- 1..K for upcoming items, NULL otherwise
FROM annotated a
CROSS JOIN furthest f
LEFT JOIN indexed_upcoming iu ON iu.land_plot_id = a.land_plot_id
ORDER BY a.pos;
