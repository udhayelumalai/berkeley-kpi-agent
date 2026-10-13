# Berkeley KPI Agent - v2.0 (Production Freeze)

Official Facilities Management Client KPI Evaluation, Reconciliation, and Governance Portal built for **Berkeley Services UAE** and its contract clients.

---

## 🌟 Core Enterprise Capabilities in v2.0

1. **Performance Dashboard (#1 Landing View)**:
   - Dynamic Month-by-Month Analytics: Live score variance, achievement %, and section breakdowns.
   - **Interactive 12-Month Annual Timeline Graph (Jan–Dec)**: Real-time visual comparison of monthly scores across the entire year, reacting dynamically to site and month selection.
   - Jump to evaluation directly by clicking any month pillar.

2. **Client Site Logo & Berkeley Brand Logo Management**:
   - Upload custom Client/Site Logos (Base64 file reader or image URL) with live preview.
   - Official logos embedded directly into KPI evaluation headers, master register, and Excel exports.
   - Customizable Berkeley Brand Logo with one-click reset to default.

3. **Questionnaire Matrix Builder & Site Cloning**:
   - **1-Click Clone Matrix**: Clone all functional sections, questions, weightages, and scoring rubrics from any existing site to another.
   - Interactive Section Management: Add, edit (code, name, max score, icon), or remove sections.
   - Interactive KPI Question Management: Add, edit (code, title, description, classification, measurement criteria, auto-scoring options), or remove questions.
   - Automatic dynamic total weightage summation.

4. **Master KPI Register with Full Audit Trail & Exact Statuses**:
   - **Exact Lifecycle Statuses**:
     - `Draft`: Initial evaluation started.
     - `Under Review - Berkeley`: Submitted by Client to Berkeley team for technical review.
     - `Under Review - Client`: Reviewed by Berkeley and returned to Client with justifications.
     - `Approved & Freezed`: Mutually agreed and permanently locked.
   - **Comprehensive Chronological Audit Trail**: Records exact timestamps, actors, roles, score diffs, technical justifications, and attached CAFM proof documents.
   - Multi-dimensional Timeline Filtering: Filter by Site, Year, Month, and Status.

5. **Role-Based Access Control (RBAC) & User Management**:
   - 4 Defined User Roles: `Super Admin`, `Admin`, `Facility Engineer` (Berkeley Team), and `Client`.
   - **Active / Inactive Account State**: Super Admins can toggle accounts between active and inactive.
   - Site Isolation: Users only access sites assigned to their account.
   - **Top-Right User Session Switcher**: Convenient persona switcher located in the top-right header.

6. **Automated Corporate Notification Engine**:
   - In-app notification center (Bell icon with unread count badge).
   - Generates formal corporate email/memo templates on submissions and approvals.
   - One-click "Copy HTML" and "Copy Text" actions.

7. **Executive Excel (.xlsx / XML) Exporter**:
   - Formatted side-by-side Client vs Berkeley vs Final score tables, remarks, justifications, and achievement percentages.

---

## 🚀 Running Locally

```bash
cd /Users/udhay/.gemini/antigravity/scratch/berkley-kpi-portal
python3 server.py
```
- Local URL: **http://localhost:8088**
- Local Network / Wi-Fi: **http://10.30.44.109:8088**

---

## ☁️ Cloud Deployment Options

### 1. Instant Cloud Tunnel (No Signup Needed)
```bash
ssh -R 80:localhost:8088 nokey@localhost.run
```

### 2. GitHub Pages (100% Free & Permanent)
```bash
git remote add origin https://github.com/<YOUR-USERNAME>/berkeley-kpi-agent.git
git push -u origin main
```
Enable GitHub Pages in Repo Settings -> Pages -> Deploy from branch `main`.

### 3. Netlify / Vercel (1-Click Drag & Drop)
Drag this directory onto [app.netlify.com/drop](https://app.netlify.com/drop) or use Vercel CLI.

### 4. Docker Container
```bash
docker build -t berkeley-kpi-agent:v2.0 .
docker run -d -p 80:8088 berkeley-kpi-agent:v2.0
```
