// Vercel Serverless Function: api/get-config.js

export default function handler(request, response) {
  // Ensure this is a GET request
  if (request.method !== 'GET') {
    response.setHeader('Allow', ['GET']);
    return response.status(405).json({ error: `Method ${request.method} Not Allowed` });
  }

  const accessCode = process.env.SKYE_MOVIE_ACCESS_CODE;

  if (!accessCode) {
    console.error('SKYE_MOVIE_ACCESS_CODE environment variable is not set in Vercel.');
    // Do not expose the absence of the variable directly to the client in detail for security.
    return response.status(500).json({ error: 'Server configuration error.' });
  }

  // Only return the access code. Could add other public configs here if needed.
  return response.status(200).json({ skyeMovieAccessCode: accessCode });
}
