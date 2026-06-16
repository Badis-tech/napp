create table roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text
);
