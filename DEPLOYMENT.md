# Schedule v3 Deployment Instructions

## Server Deployment (Backend)

1. **Upload server folder to your hosting provider**
   - Upload entire `server` folder to your web hosting
   - Make sure Node.js is supported (version 16+)

2. **Install dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set environment variables**
   - Copy `.env.production` to `.env`
   - Update PORT if needed for your hosting provider

4. **Start the server**
   ```bash
   npm start
   ```

## Client Deployment (Frontend)

1. **Build the client**
   ```bash
   cd client
   npm install
   npm run build
   ```

2. **Upload dist folder**
   - Upload contents of `client/dist` folder to your web hosting
   - Point your domain to this folder

3. **Update API URL**
   - Make sure `VITE_API_URL` in `.env.local` points to your server URL
   - Example: `VITE_API_URL=https://yourserver.com`

## Important Notes

- ✅ Database: Uses Supabase (already configured)
- ✅ Data: Already migrated and ready
- ✅ CORS: Configured for production
- ✅ Environment: Production ready

## Testing

1. Test server: `https://yourserver.com/api/clients`
2. Test client: Open your website URL

## Support

If you need help with deployment, contact your hosting provider for:
- Node.js setup
- Environment variables
- Domain configuration
