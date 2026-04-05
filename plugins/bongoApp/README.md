# BongoApp Plugin

I have successfully created a new plugin `bongoApp` that migrates the backend logic for your Bongo Cat application into the main Discord server's plugin system.

## 🚀 What's New?

The `bongoApp` plugin now handles:
1.  **Backend Bridge**: It starts an Express server on port `3001` (just like the original `server.js`) so your C# app can connect without any changes.
2.  **Discord OAuth**: Integrated authentication logic using your Discord App credentials.
3.  **Bongo Logic**: Join, Leave, Heartbeat, and Active User tracking.
4.  **Waldspiel Rendering**: Direct integration with the `waldspiel` plugin's `imageCreator` to render your animals.
5.  **Standard API Endpoints**: Provides endpoints in the `api/` directory that can be called via the main server's API bridge.

## 📂 Plugin Structure

The core files are located in `c:\Users\ttezlowa\Documents\discord\servernew\plugins\bongoApp`:
- `config.js`: Contains default configuration (JWT Secret, Discord Credentials, etc.).
- `plugin.js`: The main logic that initializes the Express bridge.
- `api/`: Standard API endpoints for the main server.
    - `authConfig.js`
    - `activeUsers.js`
    - `render.js`

## ⚙️ Configuration

The plugin uses the following defaults (migrated from your original `.env`):
- **JWT Secret**: `SUPER_SECRET_BONGO_KEY`
- **Discord Client ID**: `1486436085113294908`
- **Redirect URI**: `http://localhost:3001/api/auth/discord/callback`

> [!IMPORTANT]
> Make sure to enable the plugin in your Discord Bot manager. Once enabled, the Express server will automatically start on port 3001 whenever the bot process is running.

## 🛠️ Testing

You can now shut down the standalone server in `C:\Users\ttezlowa\Documents\bondo_cat_fake\server` and start your Discord bot instead. The Bongo App should continue to function as expected.
