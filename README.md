# Doctor Appointment Booking System (doctor-appointement-updated)

AI-powered Doctor Appointment Booking System built using the MERN stack with separate User and Admin dashboards, secure authentication, online appointment management, doctor profiles, image upload support, Pinecone vector database integration, and a responsive modern UI.

Homepage: https://doctor-appointement-updated.vercel.app

---

## Features

- User and Admin dashboards
- Secure authentication (JWT)
- Create, view, and manage appointments online
- Doctor profiles with image upload
- Pinecone vector database integration for semantic search / embeddings
- Responsive UI (mobile + desktop)
- Role-based access (users vs admins)

## Tech stack

- Frontend: React
- Backend: Node.js, Express
- Database: MongoDB
- Vector DB: Pinecone
- Image uploads: Cloudinary (or similar)
- Deployment: Vercel / Heroku / your choice

> Languages: JavaScript (99%)

---

## Quickstart

These are generic instructions — your repository may use slightly different folder names (for example `client` and `server` or `frontend` and `backend`). If you have separate folders, run the commands inside each one.

1. Clone the repo

   git clone https://github.com/BhaskarSingh123/doctor-appointement-updated.git
   cd doctor-appointement-updated

2. Install dependencies

- If there is a single package.json at the repo root:

  npm install

- If the project is split into `client/` and `server/` (or similar) directories:

  cd server && npm install
  cd ../client && npm install

3. Environment variables

Create a `.env` file for the backend (or set these values in your deployment provider). Example variables the app commonly expects:

```
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/mydb
JWT_SECRET=your_jwt_secret
PORT=5000
CLIENT_URL=http://localhost:3000

# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Pinecone (vector DB)
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=your_pinecone_environment
PINECONE_INDEX_NAME=your_index_name
```

Adjust variable names to match what's used in the repository source code. If you are unsure, search for `process.env.` in the backend code to find the exact keys.

4. Run the app (development)

- If a single `npm start` or `npm run dev` exists at root:

  npm run dev

- For separate backend/frontend:

  # start server
  cd server
  npm run dev

  # in another terminal start client
  cd ../client
  npm start

---

## Deploying

- Frontend can be deployed to Vercel, Netlify, or similar.
- Backend can be deployed to Heroku, Render, Railway, or a container platform.
- Set the same environment variables in your hosting provider.
- For Vercel deployments of fullstack apps, you may deploy frontend and backend separately or create API routes in a single Vercel project depending on repo layout.

---

## Pinecone integration

This project uses Pinecone to store embeddings for semantic search. Typical flow:

1. Generate embeddings (e.g., with OpenAI or other embedding model).
2. Upsert embeddings to a Pinecone index identified by `PINECONE_INDEX_NAME`.
3. Query the index to perform semantic search or similarity matching.

Make sure `PINECONE_API_KEY`, `PINECONE_ENVIRONMENT`, and `PINECONE_INDEX_NAME` are set in your environment.

---

## Image uploads

Image uploads are commonly handled using Cloudinary in MERN apps. Ensure Cloudinary credentials are present in the backend environment and that the upload middleware is configured correctly.

---

## Common scripts

Check package.json to confirm script names. Typical scripts you may find or add:

- `npm run dev` — start backend with nodemon
- `npm start` — start production server
- `cd client && npm start` — run React dev server

---

## Contributing

Contributions are welcome. A good starting point:

1. Fork the repository
2. Create a feature branch
3. Open a pull request with a clear description of the change

Please include tests for logic-heavy changes and keep the UI consistent.

---

## Troubleshooting

- If the server can't connect to MongoDB, double-check `MONGO_URI` and network access (IP whitelist for hosted clusters).
- If image uploads fail, verify Cloudinary keys and upload preset settings.
- If Pinecone calls fail, confirm API key and environment and that the index exists.

---

## License

Add a license file if you plan to open-source this project (for example, MIT).

---

If you'd like, I can:
- Tailor the README to match the exact folder structure and scripts (I can scan the repo and update the README accordingly),
- Add badges (build / license / dependencies) and example screenshots,
- Create a CONTRIBUTING.md or a simplified architecture diagram.
