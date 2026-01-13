// Vercel Serverless Function: api/get-config.js

export default function handler(request, response) {
  // Ensure this is a GET request
  if (request.method !== 'GET') {
    response.setHeader('Allow', ['GET']);
    return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
  }

  // Access-gate has been removed. Keep this endpoint for future public config flags
  // without requiring any server-side environment variables.
  return response.status(200).json({
    accessCodeRequired: false,
    skyeMovieAccessCode: null,
    mappleOrigin: 'https://mapple.uk',
  });
}
