# Google Login Setup

This project supports Google login for existing users. The selected role on the login page must match the role saved in the database for that Gmail address.

## 1. Create the Google OAuth Client

1. Open Google Cloud Console.
2. Go to APIs & Services.
3. Open Credentials.
4. Create Credentials -> OAuth client ID.
5. Application type: Web application.
6. Name it something like CareSync Local Dev.

## 2. Add Authorized JavaScript Origins

Add every local frontend origin you use:

```text
http://localhost:5173
http://localhost:5174
http://localhost:5175
```

Do not add `/login` or any path here. Google wants only the origin.

## 3. Add Test Users

If the OAuth consent screen is in Testing mode:

1. Go to OAuth consent screen.
2. Open Audience or Test users.
3. Add the Gmail addresses you will use for testing.

## 4. Configure Env Files

Use the OAuth Web application Client ID. Do not use the client secret.

Backend: `backend/.env`

```env
GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
```

Frontend: `frontend/.env`

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_web_client_id.apps.googleusercontent.com
```

The backend and frontend values must be the same client ID.

## 5. Restart Servers

Restart both apps after changing env files:

```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

## Common Errors

`access blocked` or `origin_mismatch`: Add the exact Vite URL shown in the browser, such as `http://localhost:5174`, to Authorized JavaScript origins.

`Google login is not configured`: `GOOGLE_CLIENT_ID` is missing from `backend/.env`, or the backend was not restarted.

`No account found for this Google email and selected role`: Create a normal account first with the same Gmail address, or select the matching role before using Google login.
