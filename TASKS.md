# TASKS

## Chatkit - NUMBER ONE PRIORITY!!! 

- [ ] This is still not working. Be proactive and FIX THIS!!!!!

## Dashboard
- [ ] Redirects to a 404 page when you click on the projects in the table.


## Tables

- [ ] Fix (tables) layout. The page width and container settings should be controlled in the root layout. This layout should just control the unique content styling.
- [ ] Meetings table - not displaying data. Should be synced with Supabase document-metadata table.
```
create table public.document_metadata (
  id text not null,
  title text null,
  url text null,
  created_at timestamp without time zone null default now(),
  type text null,
  source text null,
  content text null,
  summary text null,
  participants text null,
  tags text null,
  category text null,
  fireflies_id text null,
  fireflies_link text null,
  project_id bigint null,
  project text null,
  date timestamp with time zone null,
  outline text null,
  duration_minutes integer null,
  bullet_points text null,
  action_items text null,
  created_by uuid null default auth.uid (),
  entities jsonb null,
  file_id integer null,
  overview text null,
  employee text null,
  fireflies_file_url text null,
  description text null,
  constraint document_metadata_pkey primary key (id),
  constraint document_metadata_file_id_key unique (file_id),
  constraint document_metadata_employee_fkey foreign KEY (employee) references employees (email),
  constraint document_metadata_project_id_fkey foreign KEY (project_id) references projects (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_document_metadata_category on public.document_metadata using btree (category) TABLESPACE pg_default;

create index IF not exists idx_document_metadata_date on public.document_metadata using btree (date) TABLESPACE pg_default;

create index IF not exists idx_document_metadata_type on public.document_metadata using btree (type) TABLESPACE pg_default;

create index IF not exists idx_document_metadata_participants on public.document_metadata using gin (to_tsvector('english'::regconfig, participants)) TABLESPACE pg_default;

create index IF not exists idx_document_metadata_content_fts on public.document_metadata using gin (to_tsvector('english'::regconfig, content)) TABLESPACE pg_default;

create index IF not exists idx_document_metadata_composite on public.document_metadata using btree (type, category, date desc) TABLESPACE pg_default;

create index IF not exists idx_document_entities on public.document_metadata using gin (entities) TABLESPACE pg_default;

create index IF not exists idx_table_project_id on public.document_metadata using btree (project_id) TABLESPACE pg_default;

create index IF not exists idx_document_metadata_lower_title on public.document_metadata using btree (lower(title)) TABLESPACE pg_default;

create trigger set_project_id_from_title_trg BEFORE INSERT
or
update on document_metadata for EACH row
execute FUNCTION set_project_id_from_title ();

create trigger trg_sync_document_project_name BEFORE INSERT
or
update OF project_id on document_metadata for EACH row
execute FUNCTION sync_document_project_name ();
```

- [ ] Tasks table - not displaying data. Should be synced with Supabase project-tasks table.

## 🔄 TODO - Remaining Items:

- [ ] Fix layout on pages in the (tables) folder. **MUST BE CONSISTENT**
- [ ] Supabase auth: None of the pages should be accessible without being logged in other than the obvious login, forgot-password, create an account, ect. Even after I login its not letting me upload a document because it says I have to be logged in.
- [ ] Create a page that list all of the table pages
- [ ] Memory
- [ ] Chat history  
- [ ] Users page
- [ ] Fluid drag and drop like Notion
- [ ] Upload doc functionality
- [ ] Add a list of leadership tasks
- [ ] Create issues log Supabase table
- [ ] Sitemap page that updates automatically
- [ ] Fluid drag and drop like Notion

## Leadership Action Items
- [ ] Update Zapier integrations for Teams, Outlook, Onedrive
- [ ] Update Openai api key
- [ ] Add issues to issues log


Switch the chat to use super bass instead of open AI vector store