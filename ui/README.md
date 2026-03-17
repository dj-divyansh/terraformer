# DevOps Compass - API Dashboard

This is a React-based UI for the DevOps Compass platform, specifically designed to interact with the Terraformer API.

## Features

- **API Dashboard**: View all available API endpoints, methods, and summaries.
- **Interactive Testing**: Send requests to the API with custom parameters, headers, and bodies.
- **Real-time Responses**: View response status, time, headers, and JSON body.
- **Filtering & Favorites**: Quickly find endpoints and mark frequently used ones.
- **DevOps Compass Branding**: Integrated with the platform's visual identity.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the `ui` directory:
   ```bash
   cd ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### Configuration

- **API URL**: The API base URL is configured in `src/components/ApiDashboard.jsx`. Default is `http://localhost:3000`.

## Project Structure

- `src/components/ApiDashboard.jsx`: Main dashboard component.
- `src/components/Header.jsx`: Platform navigation header.
- `src/lib/utils.js`: Utility functions (e.g., class merging).
- `src/index.css`: Global styles and Tailwind configuration.

## Technologies

- React
- Vite
- Tailwind CSS v4
- Axios
- Lucide React (Icons)
