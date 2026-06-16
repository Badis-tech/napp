create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  role_id uuid references roles(id),
  created_at timestamp default now()
);
