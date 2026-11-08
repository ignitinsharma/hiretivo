# HireTivo

## Local installation

Install Docker Desktop, then run `sh scripts/local-up.sh` from the repository root.
Open http://localhost:3000 and create an account with an email address and password. No email service or OAuth account is required. Postgres data is stored in the `postgres_data` Docker volume and survives `docker compose down` and restarts. Keep `.env.self-hosted` private: it contains the database password and session secret. The app is bound to localhost only.

To stop the app, run `docker compose --env-file .env.self-hosted down`. Run `sh scripts/local-up.sh` again to start it with the same account and data.

This initial local slice covers installation and sign-in. Resume files and AI generation will gain local storage and model support in subsequent tickets.

## Project Overview
HireTivo is an innovative solution designed to streamline the hiring process for companies and job seekers. Our platform connects employers and candidates, making recruitment easier and more efficient.

## Tech Stack
- **Frontend:** React.js, HTML5, CSS3
- **Backend:** Node.js, Express
- **Database:** MongoDB
- **Deployment:** AWS, Docker

## Setup Instructions
1. Clone the repository:
   ```bash
   git clone https://github.com/ignitinsharma/hiretivo.git
   cd hiretivo
   ```
2. Install the required dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory and add your environment-specific configurations.
4. Start the application:
   ```bash
   npm start
   ```

## End-to-End Flow
1. Users register and create profiles.
2. Employers post job openings.
3. Candidates apply to jobs that match their skills and interests.
4. Employers review applications and schedule interviews.
5. Candidates can track their application status through the platform.

## Development Guidelines
- Follow the **GitFlow** branching model for feature development.
- Write clean and maintainable code, adhering to the company's coding standards.
- Submit pull requests for review before merging to the main branch.
- Make sure to run tests before pushing changes.
