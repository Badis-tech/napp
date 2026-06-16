create table permissions (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  description text
);
