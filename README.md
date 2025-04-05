# WoW - Israel Registration Client

A React TypeScript application for registering new players on the WoW - Israel server, which uses AzerothCore.

## Features

- Beautiful Blizzard-like UI
- Bilingual support (English and Hebrew)
- Form validation
- Direct connection to AzerothCore database
- Responsive design

## Prerequisites

- Node.js (v18 or higher)
- MySQL database (AzerothCore)
- Docker (for running AzerothCore)

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure the application by editing the `config.cfg` file in the root directory:
   ```
   # Example configuration
   SERVER_NAME = WoW Israel
   DB_HOST = localhost
   DB_USER = root
   DB_PASSWORD = root
   DB_NAME = acore_auth
   ```
4. Add the WoW Israel logo image file to `public/images/wow-israel-logo.png` (the logo will be displayed large and will slightly overlap with the content)

## Configuration

The application uses two separate configuration files:

### 1. Server Configuration (`config.cfg`)

This file contains server-side settings including database connection details, account creation options, and server-specific settings. It is read by the server at startup.

```
# Example server config.cfg
DB_HOST = localhost
DB_USER = root
DB_PASSWORD = root
DB_NAME = acore_auth
```

### 2. Client Configuration (`public/client.cfg`)

This file contains client-side settings including API endpoints, UI configuration, and feature toggles. It is loaded by the browser when the application starts.

```
# Example client.cfg
API_BASE_URL = http://localhost:3000/api
FEATURE_ACCOUNT_CREATION = true
SERVER_NAME = WoW Israel
```

### Portable Configuration

Both configuration files are plain text with a simple format:
- Lines starting with `#` are comments
- Configuration values use the format `KEY = VALUE`
- Empty lines are ignored

This approach ensures the application is portable and can be configured for different environments without modifying the code.

## Running the Application

### Development Mode

To run both the frontend and backend in development mode:

```
npm run dev:all
```

This will start:
- Frontend on http://localhost:5173
- Backend API on http://localhost:3000

### Production Build

To build the application for production:

```
npm run build
```

## Database Connection

The application connects directly to the AzerothCore database. Make sure your AzerothCore server is running and the database is accessible with the credentials specified in the `.env` file.

## Account Creation

When a user registers, their account is created in the AzerothCore database with the following information:
- Username
- Email
- Password (hashed using SHA1, as required by AzerothCore)

## UI Styling

The application uses World of Warcraft-inspired styling for a consistent and immersive user experience:

### WoW-Style Elements

- **Buttons**: Stylized with WoW-like background textures
- **Forms**: Themed with parchment-style backgrounds
- **Typography**: Uses Cinzel font to match the WoW aesthetic
- **Colors**: Gold and brown color scheme matching the WoW UI

### Customizing UI

You can customize the appearance by:

1. Replacing the background images in `public/images/`:
   - `wow-button-bg.png` - Background image for buttons
   - `wow-form-bg.png` - Background image for forms
   - `wow-background.jpg` - Main background image

2. Adjusting colors in the theme configuration (`src/theme/theme.ts`)

3. Using the provided CSS classes in your components:
   - `.wow-button` - Applies WoW styling to buttons
   - `.wow-form` - Applies WoW styling to containers
   - `.wow-title` - Applies WoW styling to titles
   - `.wow-text` - Applies WoW text styling

## License

MIT
