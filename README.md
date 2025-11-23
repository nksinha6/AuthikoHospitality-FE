
## Stack

- React 19 with SWC-powered Vite dev server.
- React Router v7 for SPA navigation.
- TanStack Query v5 + Axios for API calls, caching, and devtools.

## Style Guide

**⚠️ IMPORTANT:** This project enforces strict color usage and accessibility guidelines.

- **All colors must use CSS variables from `src/styles/colors.css`**
- **No hardcoded hex/rgb colors allowed**
- **WCAG AA contrast compliance required (4.5:1 for normal text, 3:1 for large text)**

See [STYLE_GUIDE.md](./STYLE_GUIDE.md) for complete guidelines and color system documentation.

## Getting Started

### Environment Variables

Create environment files for different environments:

**`.env.development`** (for local development):
```env
VITE_API_BASE_URL=https://whale-app-tcfko.ondigitalocean.app
```

**`.env.production`** (for production builds):
```env
VITE_API_BASE_URL=https://whale-app-tcfko.ondigitalocean.app
```

**Note:** Vite requires the `VITE_` prefix for environment variables to be exposed to the client.

### Installation & Running

```bash
npm install
npm run dev
```

The dev server runs at <http://localhost:5173>. Update files inside `src/` to
start building your application. By default, the app shows the login screen; the
dashboard becomes accessible only after a successful sign-in.

### Building for Production

```bash
npm run build
```

The production build will use the `.env.production` file for the API base URL.
