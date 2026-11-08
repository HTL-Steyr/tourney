![tourney](./.github/assets/preview-banner.jpg)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/v/release/HTL-Steyr/tourney?color=blue)](https://github.com/HTL-Steyr/tourney/releases)
[![Last Commit](https://img.shields.io/github/last-commit/HTL-Steyr/tourney)](https://github.com/HTL-Steyr/tourney/commits)

[![Instagram](https://img.shields.io/badge/Instagram-E1306C?logo=instagram&logoColor=white)](https://www.instagram.com/htlsteyr/)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fwww.htl-steyr.ac.at&up_message=htl-steyr.ac.at&logo=google-chrome&logoColor=white)](https://www.htl-steyr.ac.at/)

# Tourney

Tourney is a comprehensive tournament management system designed to streamline the organization and execution of sports tournaments.
It provides a user-friendly interface for administrators to set up and manage tournaments, while also offering a live viewer experience for spectators to stay updated on matches, brackets, and standings in real-time.

### Features

- 🏆 Tournament setup for football, volleyball, and basketball with rules, prizes, and automatic group assignment
- 📡 Live viewer with real-time updates on matches, brackets and standings
- 🎓 Class and school year management
- 🎟️ Central registration management with registration links, teams, pdf generation and status handling
- 📰 News and gallery management directly from the admin dashboard
- 🌳 Public tournament details, live brackets, standings, and media updates
- 🤖 AI assistant

### Live Deployment

> https://tourney.dino-kupinic.dev

## ⏳ Activity

![Alt](https://repobeats.axiom.co/api/embed/bd1b64dfb166474122230a0f147ea9f77e408ad1.svg "Repobeats analytics image")

## ♻️ Release Cycle

tourney follows the [Semantic Versioning](https://semver.org/) guidelines.

## ✨ Installation and Configuration

### Installation for Development

1. clone the repository:

```bash
git clone https://github.com/Dino-Kupinic/tourney.git
```

#### Quick Installation Script

2. Run the installation script and follow the instructions

```bash
./scripts/setup.sh
```

> [!WARNING]
> The setup script is due to be changed.

> [!NOTE]
> Windows users need WSL installed.

Requirements:

- Docker
- Bun
- Node.js 22

#### Manual Installation

2. install packages

```bash
bun install
```

> [!TIP]
> If you don't have bun installed, checkout https://bun.sh to install for your operating system.

3. optionally run all development servers

```bash
bun run dev
```

### Backend

1. run supabase

```bash
bun run start:supabase
```

> [!TIP]
> If you don't have docker installed, checkout https://www.docker.com/.

2. head to http://127.0.0.1:54323

If it works, great!

### Frontends

#### Admin

1. define environment variables

Create a `.env` file and checkout the `.env.example`.
Copy the content into your `.env` and replace the following fields with your own.

| Field                    | Description                                            |
| ------------------------ | ------------------------------------------------------ |
| `SUPABASE_URL`           | URL to Supabase API                                    |
| `SUPABASE_KEY`           | Anon key                                               |
| `SUPABASE_SECRET_KEY`    | Secret key (service-level key)                         |
| `OPENAI_API_KEY`         | OpenAI API key for the admin AI assistant              |
| `NUXT_PUBLIC_CLIENT_URL` | URL of the viewer app, default `http://localhost:3001` |

2. run dev server

```bash
bun run dev:admin
```

3. Head to http://localhost:3000/

If it works, great!

#### Viewer

1. define environment variables

Create a `.env` file and checkout the `.env.example`. Copy the content into your `.env` and replace the following fields

| Field                     | Description                  |
| ------------------------- | ---------------------------- |
| `SUPABASE_URL`            | URL to Supabase API          |
| `SUPABASE_KEY`            | Anon key                     |
| `NUXT_GOTENBERG_URL`      | URL to the Gotenberg service |
| `NUXT_GOTENBERG_USERNAME` | Gotenberg username           |
| `NUXT_GOTENBERG_PASSWORD` | Gotenberg password           |

2. run dev server

```bash
bun run dev:viewer
```

3. Head to http://localhost:3001/

If it works, great!

#### Landing page (www)

1. define environment variables

Create a `.env` file and checkout the `.env.example`. Copy the content into your `.env` and replace the following fields

| Field                              | Description           |
| ---------------------------------- | --------------------- | --- |
| `SUPABASE_URL`                     | URL to Supabase API   |
| `SUPABASE_KEY`                     | Anon key              |
| `NUXT_PUBLIC_ADMIN_APP_URL`        | URL of the admin app  |
| `NUXT_PUBLIC_VIEWER_APP_URL`       | URL of the viewer app |
| `NUXT_PUBLIC_MUX_DEMO_PLAYBACK_ID` | URL of mux asset id   |     |

2. run dev server

```bash
bun run dev:www
```

3. Head to http://localhost:3002/

If it works, great!

#### User creator script

1. define environment variables

Create a `.env` file and checkout the `.env.example`. Copy the content into your `.env` and replace the following fields

| Field                 | Description                    |
| --------------------- | ------------------------------ |
| `SUPABASE_URL`        | URL to Supabase API            |
| `SUPABASE_SECRET_KEY` | Secret key (service-level key) |
| `USERS_TO_CREATE`     | See comment in `.env.example`  |

2. run the script

```bash
bun run create:users
```

If it works, great! You can now log in in the admin dashboard with the created users.

## 😄 Authors

### Creator

- [@Dino Kupinic](https://www.github.com/Dino-Kupinic)

## 🛠️ Tech Stack

- Bun
- Turbo
- Nuxt 4
- Supabase
- Docker
- OpenAI API
- Gotenberg

## Contributing

Contributions are always welcome! Feel free to create an issue or submit a pull request.
Please follow coding standards and commit message conventions.

## 😊 License

[MIT](https://choosealicense.com/licenses/mit/)
