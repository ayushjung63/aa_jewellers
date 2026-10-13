-- Applied automatically by `npm run dev` / `npm run build` (lib/migrate.mts).
-- Keep every statement safe to re-run: `if not exists`, `or replace`,
-- and for new columns on existing tables: alter table x add column if not exists ...

create table if not exists products (
  id           int generated always as identity primary key,
  name         text not null,
  sku          text unique,
  cost_price   numeric(10,2) not null default 0 check (cost_price >= 0),
  sell_price   numeric(10,2) not null check (sell_price >= 0),
  stock_qty    int not null default 0 check (stock_qty >= 0),
  low_stock_at int not null default 3 check (low_stock_at >= 0),
  image_url    text,
  photo        bytea,
  created_at   timestamptz not null default now()
);

create table if not exists orders (
  id            int generated always as identity primary key,
  order_date    date not null,
  customer_name text not null,
  phone         text,
  address       text,
  channel       text not null default 'Instagram'
                check (channel in ('Instagram','Facebook','WhatsApp','TikTok','Website','Other')),
  status        text not null default 'Pending'
                check (status in ('Pending','Delivered','Returned','Refused','Cancelled')),
  payment       text not null default 'COD' check (payment in ('Paid','COD','Unpaid')),
  discount      numeric(10,2) not null default 0 check (discount >= 0),
  total         numeric(10,2) not null default 0,
  created_at    timestamptz not null default now()
);
-- 2026-10-11: Packed/Shipped folded into Pending. 2026-10-13: Refused + Cancelled added (void, like Returned).
update orders set status = 'Pending' where status in ('Packed','Shipped');
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check check (status in ('Pending','Delivered','Returned','Refused','Cancelled'));
create index if not exists orders_date on orders (order_date);
-- Customer lookups match on lower(name) + phone.
create index if not exists orders_customer on orders (lower(customer_name), coalesce(phone, ''));

-- 2026-10-13: small JPEG for list thumbnails; photo keeps the 800px original.
alter table products add column if not exists thumb bytea;

create table if not exists order_items (
  order_id   int not null references orders on delete cascade,
  product_id int not null references products,
  qty        int not null check (qty > 0),
  unit_price numeric(10,2) not null
);
create index if not exists order_items_order on order_items (order_id);

create table if not exists expenses (
  id     int generated always as identity primary key,
  title  text not null,
  amount numeric(10,2) not null check (amount > 0),
  date   date not null
);
create index if not exists expenses_date on expenses (date);

-- Place an order atomically: deduct stock, snapshot prices, compute total.
-- p_items: [{"product_id": 1, "qty": 2}, ...]
create or replace function create_order(p_order jsonb, p_items jsonb) returns int
language plpgsql as $$
declare
  oid int;
  it  jsonb;
  pid int;
  price numeric;
  q   int;
  sub numeric := 0;
begin
  if jsonb_array_length(p_items) = 0 then raise exception 'Add at least one item'; end if;

  insert into orders (order_date, customer_name, phone, address, channel, payment, status, discount)
  values ((p_order->>'order_date')::date, p_order->>'customer_name', p_order->>'phone',
          p_order->>'address', p_order->>'channel', p_order->>'payment',
          coalesce(p_order->>'status', 'Pending'),
          coalesce(nullif(p_order->>'discount', '')::numeric, 0))
  returning id into oid;

  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'qty')::int;
    update products set stock_qty = stock_qty - q
     where id = (it->>'product_id')::int and stock_qty >= q
    returning id, sell_price into pid, price; -- not `*`: that would read the photo bytes
    if not found then
      raise exception 'Not enough stock for %',
        coalesce((select name from products where id = (it->>'product_id')::int), 'item');
    end if;
    insert into order_items values (oid, pid, q, price);
    sub := sub + q * price;
  end loop;

  update orders set total = greatest(sub - discount, 0) where id = oid;
  return oid;
end $$;

-- Returned/Refused/Cancelled put stock back; moving out of them takes it out again. Keep in sync with VOID in lib/format.ts.
create or replace function restock_on_status() returns trigger
language plpgsql as $$
declare
  was_void bool := old.status in ('Returned','Refused','Cancelled');
  is_void  bool := new.status in ('Returned','Refused','Cancelled');
  sign     int;
begin
  if was_void = is_void then return new; end if;
  sign := case when is_void then 1 else -1 end;
  update products p set stock_qty = p.stock_qty + sign * i.q
    from (select product_id, sum(qty) q from order_items where order_id = new.id group by 1) i
   where p.id = i.product_id;
  return new;
end $$;

create or replace trigger orders_restock after update of status on orders
for each row execute function restock_on_status();


-- Logins. At most 3 people: ids are fixed slots 1–3. Passwords are bcrypt via pgcrypto's crypt().
-- Add a user / reset a password: npm run user -- <username>
create extension if not exists pgcrypto;

create table if not exists users (
  id              int primary key check (id between 1 and 3),
  username        text not null unique check (username = lower(username)),
  password_hash   text not null,
  session_version int not null default 1, -- bumped on password change, logs out other devices
  failed_logins   int not null default 0,
  locked_until    timestamptz
);

-- Who did what. Username (not a foreign key) so the log survives removing a user.
create table if not exists activity (
  id       int generated always as identity primary key,
  at       timestamptz not null default now(),
  username text not null,
  action   text not null
);
