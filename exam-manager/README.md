# Exam Question Manager

A private web application for managing university exam questions with full LaTeX support.

## Features

- Full LaTeX support for questions and solutions (rendered with KaTeX)
- Multiple question types: Multiple choice, Short answer, Long form, Numerical
- Organization by Course, Topic, Difficulty, and Tags
- Image/diagram attachments
- Exam generation with LaTeX export (Overleaf-compatible)
- Question usage tracking
- Automatic daily backups
- Secure authentication

## Quick Start

### Prerequisites

1. Install Docker Desktop:
   - **Windows**: https://docs.docker.com/desktop/install/windows-install/
   - **Mac**: https://docs.docker.com/desktop/install/mac-install/

2. Place this folder in your Dropbox/Google Drive folder for automatic sync

### First Time Setup

1. Open a terminal in this folder

2. Start the application:
   ```bash
   docker compose up --build
   ```

3. Wait for the build to complete (first time takes a few minutes)

4. Open your browser to: http://localhost:3000

5. Login with default credentials:
   - Email: `admin@exammanager.local`
   - Password: `changeme123`
   - **Change this password immediately!**

### Daily Usage

**Start the app:**
```bash
docker compose up
```

**Stop the app:**
```bash
docker compose down
```

**View logs:**
```bash
docker compose logs -f app
```

## Using on Another Computer

1. Make sure Docker Desktop is installed
2. Let Dropbox/Google Drive sync the folder
3. Open terminal in this folder
4. Run: `docker compose up`
5. Go to Settings > Restore from Backup
6. Select the latest backup file from the `backups/` folder

## Backups

- **Automatic**: Database is backed up daily to `./backups/` folder
- **Manual**: Go to Settings > Create Backup in the app
- **Location**: `./backups/exam_manager_YYYYMMDD_HHMMSS.sql`
- **Retention**: Last 30 backups are kept automatically
- **Sync**: Backups folder syncs via Dropbox/Google Drive

## Folder Structure

```
exam-manager/
├── docker-compose.yml    # Docker configuration
├── backups/              # Database backups (synced)
├── uploads/              # Question images (synced)
├── src/                  # Application source code
└── prisma/               # Database schema
```

## Security Notes

1. Change the default password after first login
2. Update `NEXTAUTH_SECRET` in `.env` to a random 32+ character string
3. The database runs in an isolated Docker container
4. All passwords are hashed with bcrypt (cost factor 12)

## Troubleshooting

**App won't start:**
```bash
docker compose down
docker compose up --build
```

**Database issues:**
```bash
docker compose down -v  # Warning: removes database volume
docker compose up --build
# Then restore from backup
```

**View database directly:**
```bash
docker compose exec db psql -U examuser exam_manager
```

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript
- Styling: Tailwind CSS
- Database: PostgreSQL 15
- ORM: Prisma
- Auth: NextAuth.js
- LaTeX: KaTeX
- Containerization: Docker
