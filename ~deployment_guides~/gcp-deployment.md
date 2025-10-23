# Dynamous AI Agent — Google Cloud Deployment Guide

Deploy the full Dynamous AI Agent stack — React front‑end, FastAPI agent API, and RAG pipeline — on **Google Cloud Platform (GCP)**. Terraform provisions the infrastructure and Cloud Build delivers continuous deployment.

This guide is more concise since this is a more advanced tutorial and assumes you are somewhat comfortable with deploying applications to the cloud!

---

## 1  Prerequisites

1. **Google Cloud project** — [Create one](https://console.cloud.google.com/projectcreate) and note its **`PROJECT_ID`** & **`PROJECT_NUMBER`**. Be sure to add billing information as well or you'll get an error with enabling services below.
2. **Google Cloud SDK** — Install via the [SDK install guide](https://cloud.google.com/sdk/docs/install) then initialise:

   ```bash
   gcloud init
   gcloud config set project PROJECT_ID
   gcloud auth application-default login    # For Terraform access
   ```

   Then follow the auth instructions to set the GOOGLE_APPLICATION_CREDENTIALS environment variable to the given path if prompted.
3. **Terraform CLI ≥ 1.7** — [Download Terraform](https://developer.hashicorp.com/terraform/downloads). Then add the path to terraform.exe to your system PATH.
4. **Supabase project** — create, then run the schema script: `6_Agent_Deployment/sql/0-all-tables.sql`
5. **Google Drive service account** — JSON key + Drive folder ID from local setup.
6. **Domain names ready** — You'll need access to your DNS provider to add records.
7. **Enable required GCP APIs** (run once):

   ```bash
   gcloud services enable run.googleapis.com runapps.googleapis.com artifactregistry.googleapis.com storage.googleapis.com cloudbuild.googleapis com cloudscheduler.googleapis.com secretmanager.googleapis.com compute.googleapis.com certificatemanager.googleapis.com
   ```

> **Note**  — `infra/terraform.tfvars` is in the **`.gitignore`** so secrets never reach Git.  You can later migrate any secret value to **Secret Manager** and reference it from Terraform if you wish as well.

---

## 2  Repository layout

```text
6_Agent_Deployment/
├─ backend_agent_api/        # FastAPI service (Dockerfile)
├─ backend_rag_pipeline/     # RAG pipeline (Dockerfile)
└─ frontend/                 # React (Vite) source
infra/
├─ main.tf
├─ variables.tf
├─ versions.tf
└─ terraform.tfvars.example
cloudbuild.yaml
```

---

## 3  Configure `infra/terraform.tfvars`, `infra/versions.tf`, and `cloudbuild.yaml`

First, make a copy of `terraform.tfvars.example` and rename it to `terraform.tfvars`. This is where you'll put all of your environment variables for the backend:

```hcl
project_id      = "ai-agent-mastery"
region          = "us-central1"

frontend_domain = "chat.dynamous.ai"
api_domain      = "agent.dynamous.ai"

# ---------- Agent API env vars ----------
agent_env = { … }

# ---------- RAG pipeline env vars ----------
rag_env  = { … }
```

*(Insert the full maps exactly as in the example file; keep secrets here or pull from Secret Manager.)*

Then for `infra/versions.tf`, uncomment the bottom component and replace YOUR-PROJECT-ID with your GCP project ID (mine was dynamous-gcp-deployment in the video guide).

Last for `cloudbuild.yaml`, Edit the top of the file to set your values for _REGION, _REPO, _BUCKET, _API_DOMAIN, and the default values for the frontend environment variables towards the bottom (all frontend values are public).

> It's ideal if you have your own repository for this work, so feel free to create your own private GitHub repository based on the code for the AI Agent Mastery course.

---

## 4  Initial bootstrap (one‑time)

> **Why this order?**  The first Cloud Build run creates the build service‑account - it is supposed to fail.  We grant roles **before** a second run so the full deploy succeeds.

1. **Kick‑start Cloud Build** (creates the service account for us):

   ```bash
   gcloud builds submit --config cloudbuild.yaml . --substitutions=_BOOTSTRAP_ONLY=yes
   ```

   This step will fail but will create the account below for us to set permissions.

2. **Grant roles** to `PROJECT_NUMBER@cloudbuild.gserviceaccount.com`:

   * `roles/run.admin`
   * `roles/artifactregistry.writer`
   * `roles/storage.admin`
   * `roles/cloudscheduler.admin`
   * `roles/secretmanager.secretAccessor`
   * `roles/logging.logWriter`
   * `roles/iam.serviceAccountUser`

You can do this by going to APIs and Services -> Credentials -> Click on your service account -> Permissions -> Manage access -> Add roels

3. **Full Cloud Build run** (now succeeds with new roles):

   ```bash
   gcloud builds submit --config cloudbuild.yaml . --substitutions=_BOOTSTRAP_ONLY=yes
   ```

   Terraform can now find the pushed `:latest` images; Cloud Run and Scheduler come up green.   

4. **Configure Organization Policy for Public Access**:
   
   - Go to **IAM & Admin** → **Organization Policies** (make sure you are in your project, not organization level!)
   - Search for **"Domain restricted sharing"** or `iam.allowedPolicyMemberDomains`
   - Click **"Manage Policy"**
   - Select **"Override parent's policy"**
   - Under **Policy enforcement**, select **"Replace"**
   - Click **"Add a rule"**
   - Set **Policy Values** to **"Allow All"**
   - Click **"Done"** → **"Set Policy"**   

5. **Provision infrastructure**:

   ```bash
   cd infra
   
   # FIRST: Create state bucket and update versions.tf
   gsutil mb gs://tfstate-${PROJECT_ID} # Replace with your project ID
   # Edit versions.tf line 11: replace YOUR-PROJECT-ID with your actual project ID
   
   terraform init
   terraform apply      # review → yes
   ```

Your infrastructure is now deployed to GCP!

---

## 5  `cloudbuild.yaml` at a glance

Just so you understand what is being created at a high level:

| Step                | Action                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **build-agent-api** | Build FastAPI image → push → `gcloud run deploy`                                           |
| **build-rag**       | Build RAG image → push → `gcloud beta run jobs deploy`                                     |
| **build-frontend**  | Create `.env.production` from build variables → `npm run build` → `gsutil rsync` to bucket |

`_BOOTSTRAP_ONLY=yes` skips deploy commands which we only need within continuous delivery (CD).

The GCP free tier is going to cover basically everything here except the load balancer for the frontend - your cost for development or lighter traffice is only going to be ~$20-$30 per month. On top of that, GCP offers $300 in free credits for the first 90 days!

---

## 6  DNS Configuration

After running `terraform apply`, you need to configure DNS records at your domain provider.

### Get the frontend IP

```bash
gcloud compute forwarding-rules list
# Look for EXTERNAL_IP of frontend-lb-forwarding-rule
```

### Create DNS records

At your DNS provider, create these two records:

**Frontend (A record)**:
- Name: `chat` (just the subdomain, not full domain)
- Type: A
- Value: [IP address from step above]
- TTL: 300 or Automatic

**API (CNAME record)**:
- Name: `agent` (just the subdomain, not full domain)
- Type: CNAME
- Value: `ghs.googlehosted.com`
- TTL: 300 or Automatic

> **Troubleshooting**: If SSL certificates stay "PROVISIONING" for over an hour, double-check your DNS records. The certificates won't provision until DNS is properly configured.

## 7  Smoke test

After ~5-30 minutes to give time for DNS propagation:

1. Visit `https://chat.dynamous.ai` (replace with your frontend URL) — page loads, no 404/403.
2. `curl https://agent.dynamous.ai/api/pydantic-agent` (replace with your agent API URL) — returns 200.
3. Upload a doc to the RAG Google Drive folder → wait ≤ 10 min → ask agent → the new content is referenced.

> Sometimes it can take even longer for SSL certificates to provision. You can view the status of your SSL certs by searching for and vising the Cerfiticate manager in GCP.

---

## 8  Continuous deployment trigger

1. **Connect GitHub** → Cloud Build → Repositories → Link repository → Conection -> Create host connection -> Set up GitHub.
2. **Create trigger** -> Cloud Build → Triggers -> Create trigger:

   * *Event*: Push to a branch
   * *Source*: Cloud Build repositories
   * *Repository*: Connect new repository -> GitHub for source -> select your repository
   * *Branch*: Generally you'll use your main branch to deploy, but feel free to adjust the regex to include other branches
   * *Configuration*: Leave as autodetected if `cloudbuild.yml` is in the root of the repo (it is for us)
   * *Service Account*: Select the compute service account we have been using

> **Why no API keys here?**  Runtime secrets (OpenAI key, Brave key, Supabase service key, GDrive JSON, etc.) are injected by **Terraform** straight into Cloud Run and Cloud Run Job. Cloud Build never needs to read them, so they stay local in `terraform.tfvars` **or** in Secret Manager referenced by Terraform.  Cloud Build only needs Secret Manager access if you later decide to bake a secret into the React bundle.

---

## 9  Troubleshooting quick‑hits

| Symptom                         | Fix                                                                  |
| ------------------------------- | -------------------------------------------------------------------- |
| Build fails on deploy           | Confirm Cloud Build SA roles; ensure second run after granting roles |
| Cert stuck "PROVISIONING"       | Set DNS: Frontend A→[LB IP], API CNAME→ghs.googlehosted.com          |
| Scheduler firing but job absent | IAM on Scheduler SA: must have Run Invoker role on the job           |
| Old JS/CSS                      | `gsutil rsync -d` deletes stale assets; invalidate CDN if enabled    |

---

**You’re live!**  From now on, every commit to *main* rebuilds and redeploys automatically — fully IaC, fully automated. 🚀
