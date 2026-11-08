WITH ranked_teams AS (
  SELECT
    t.id,
    row_number() OVER (
      PARTITION BY t.registration_id
      ORDER BY count(p.id) DESC, t.created_at ASC, t.id ASC
    ) AS row_num
  FROM public.team AS t
  LEFT JOIN public.player AS p
    ON p.team_id = t.id
  GROUP BY t.id
)
DELETE FROM public.team
WHERE id IN (
  SELECT id
  FROM ranked_teams
  WHERE row_num > 1
);

ALTER TABLE public.team
  ADD CONSTRAINT team_registration_id_key UNIQUE (registration_id);
