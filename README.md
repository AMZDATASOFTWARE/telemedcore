**Welcome to your Base44 project**

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Use Node `20` (`.nvmrc`) or any version compatible with `>=20 <23`
4. Install dependencies: `npm install`
5. Copy `.env.example` to `.env.local` and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
VITE_BASE44_FUNCTIONS_VERSION=

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

Validate before deploy:

```bash
npm run lint
npm run typecheck
npm run build
```

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

Recommended deploy checklist:

1. Configure production values for `VITE_BASE44_APP_ID`, `VITE_BASE44_APP_BASE_URL`, and `VITE_BASE44_FUNCTIONS_VERSION`
2. Run `npm run lint`, `npm run typecheck`, and `npm run build`
3. Publish from Base44

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
