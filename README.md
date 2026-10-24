# Sai City Builders 🏗️

### Building Trust. Creating Spaces. Shaping Futures.

A modern web platform for Sai City Builders, designed to showcase construction projects, present services, manage customer enquiries, and streamline business operations through an administrative dashboard.

<p align="center">
  <img src="https://img.shields.io/github/stars/PrathameshHon/saicitybuilds?style=for-the-badge&color=yellow" alt="GitHub Stars" />
  <img src="https://img.shields.io/github/forks/PrathameshHon/saicitybuilds?style=for-the-badge&color=blue" alt="GitHub Forks" />
  <img src="https://img.shields.io/github/last-commit/PrathameshHon/saicitybuilds?style=for-the-badge&color=green" alt="Last Commit" />
  <img src="https://img.shields.io/github/license/PrathameshHon/saicitybuilds?style=for-the-badge" alt="License" />
</p>

---

## 📌 About the Project

Sai City Builders is a web application built to establish a professional digital presence for a construction business. It brings project information, customer interactions, and administrative management together in one platform.

**Repository:** [PrathameshHon/saicitybuilds](https://github.com/PrathameshHon/saicitybuilds)

## ✨ Key Features

- 🏢 **Business Website** — Present the company, its services, and projects.
- 📋 **Project Showcase** — Display construction projects and relevant details.
- 📩 **Customer Enquiries** — Support customer enquiries and lead management.
- 🔐 **Admin Dashboard** — Manage supported website content and settings.
- 🛒 **Booking and Orders** — Support the order and booking workflows implemented in the application.
- 💳 **Payment Integration** — Razorpay integration, subject to configuration.
- 🗄️ **Database Integration** — Persistent application data through the configured database.
- 📱 **Responsive Design** — A website designed for desktop and mobile screens.

## 📊 Project Activity

These badges update automatically from GitHub.

| Metric | Live information |
|---|---|
| Repository stars | ![Stars](https://img.shields.io/github/stars/PrathameshHon/saicitybuilds?style=flat-square) |
| Forks | ![Forks](https://img.shields.io/github/forks/PrathameshHon/saicitybuilds?style=flat-square) |
| Open issues | ![Issues](https://img.shields.io/github/issues/PrathameshHon/saicitybuilds?style=flat-square) |
| Latest commit | ![Last commit](https://img.shields.io/github/last-commit/PrathameshHon/saicitybuilds?style=flat-square) |

**Repository traffic analytics:** Repository maintainers can view visitor counts, referring sites, and popular pages through [GitHub Insights → Traffic](https://github.com/PrathameshHon/saicitybuilds/graphs/traffic).

*Note: GitHub's built-in traffic analytics retains detailed traffic data for the last 14 days.*

## 🛠️ Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **Styling:** CSS and the styling framework configured in the project
- **Database:** Prisma ORM with the configured database provider
- **Authentication:** Admin authentication and signed sessions
- **Payments:** Razorpay integration
- **Deployment:** Compatible with a properly configured Next.js hosting environment

## 🏛️ Architecture Overview

```text
Customer / Administrator
          |
          v
    Next.js Website
          |
          v
     API Routes
      /      \
     v        v
 Database   Payment Gateway
 (Prisma)    (Razorpay)
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/PrathameshHon/saicitybuilds.git
cd saicitybuilds
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file using the variable names documented in the deployment guide. Configure the database connection, session-signing secret, and payment credentials through environment variables.

**Never commit actual passwords, API keys, database tokens, or production secrets.**

### 4. Run the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

Check the repository's deployment documentation for database setup, migrations, and production deployment instructions.

## 📈 Website Analytics

To understand how the live website performs, add privacy-conscious website analytics.

Useful metrics include:

- **Total page views** — How often pages are viewed.
- **Unique visitors** — Estimated distinct visitors over a defined period.
- **Popular pages** — Which projects and pages attract attention.
- **Traffic sources** — Whether visitors arrive through search, social media, or direct links.
- **Device breakdown** — Desktop versus mobile traffic.
- **Enquiry conversions** — How many visitors submit an enquiry or booking form.

Visitor identities are not automatically available through ordinary analytics. Use consent-aware analytics and avoid collecting personal information unnecessarily.

## 🔒 Security

- Keep administrative credentials private.
- Store secrets in environment variables or a secure secrets manager.
- Never expose passwords or payment secrets through public API responses.
- Use secure session cookies and strong session-signing secrets.
- Review dependencies and database access permissions regularly.

## 🗺️ Roadmap

- [ ] Enhanced project gallery
- [ ] Customer enquiry analytics
- [ ] Website traffic dashboard
- [ ] Improved booking and order reporting
- [ ] Performance and accessibility improvements
- [ ] Additional automated tests

## 👨‍💻 Maintainer

**Prathamesh Hon**

GitHub: [@PrathameshHon](https://github.com/PrathameshHon)

## 📄 License

Check the repository for the applicable license before redistributing or reusing the project.

---

<p align="center">
  <b>Sai City Builders</b><br/>
  Building a stronger digital presence for a better-built future.
</p>

