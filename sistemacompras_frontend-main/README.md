# React Vite Tailwind Dashboard

## Project Description
This project is a React dashboard application built with Vite and styled using Tailwind CSS. It features protected routes, authentication with simulated backend services, and a clean responsive layout. The app manages "requerimientos" (requests) through various pages including listings, details, and status updates. 

It includes:
- Login and authentication with persistence
- Protected routes with redirect for unauthenticated users
- Dashboard layout with Header, Sidebar, Footer
- Pages for viewing and managing requerimientos
- Simulated async API calls with mock data
- Toast notifications and loading indicators
- Unit and integration tests with Vitest and React Testing Library

## Features
- User authentication with email and password
- Route guarding for private routes
- List, filter, and search requerimientos
- Detail view with status update dropdown
- Deposito page showing requerimientos ready for finalization
- Responsive sidebar navigation
- Toast notifications for user feedback
- Loading spinners during async operations

## Prerequisites
- Node.js v18 or higher (recommended)
- npm v9 or higher (comes with Node.js)

## Installation
1. Clone the repository or download the source code.
2. Navigate to the project root directory.
3. Install dependencies:

    npm install

## Configuration
- Copy `.env.example` to `.env` if you want to add environment variables.
- Currently, the app uses mock data and does not require any real environment variables.
- If you use a real backend, set `VITE_API_URL` accordingly.

## Running the Application
- To start the development server with hot reload:

    npm run dev

- Open your browser at http://localhost:5173 (or the URL shown in the terminal).

- To build the app for production:

    npm run build

- To preview the production build locally:

    npm run preview

## Usage
- Navigate to the Login page to authenticate using one of the mock users.
- After login, access protected routes such as Home, Requerimientos, Compras, Depósito, and Perfil.
- Use the sidebar to navigate between pages.
- On Requerimientos list, filter and search requerimientos.
- Click on a requerimiento to view details and update its status.
- On Deposito page, confirm reception of requerimientos.
- Use Logout button in sidebar to sign out.

## Troubleshooting
- If you see a blank page, check the browser console for errors.
- Ensure Node.js and npm are installed and up to date.
- Delete `node_modules` and reinstall with `npm install` if dependencies fail.
- For environment variable changes, restart the dev server.
- If tests fail, verify you are running Node.js 18+ and run with `npm run test`.

## Project Structure
- `src/main.jsx`: React entry point rendering the app router.
- `src/index.css`: Global Tailwind CSS styles.
- `src/router/`: Route definitions and private route guard.
- `src/hooks/useAuth.js`: Authentication management hook.
- `src/services/`: Mock data and simulated API functions.
- `src/components/`: Reusable UI components (Header, Sidebar, Footer, Loader, Toast, Table).
- `src/layout/`: Dashboard layout combining components.
- `src/pages/`: Application pages for login, home, requerimientos, deposito, compras, perfil.
- `tests/`: Unit and integration tests using Vitest and React Testing Library.

---

Enjoy building and extending this React Vite Tailwind dashboard app!
