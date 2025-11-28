// Test script to store sample video data in Vercel Blob
const sampleData = {
  "videos": [
    {
      "name": "Serveur 1",
      "url": "https://api-stream.ztvplus.workers.dev/player?url=https://lb.daisukianime.xyz/dist/embedv.html?id=yvcnj9vnu5f4&asi=1&time=0",
      "lang": "vostfr",
      "quality": "1080p",
      "pub": 0
    },
    {
      "name": "Serveur 2",
      "url": "https://example.com/video-serveur2",
      "lang": "vf",
      "quality": "720p",
      "pub": 1
    }
  ]
};

// Test with movie ID 1363123 (from your example)
const movieId = "1363123";

console.log('Sample data to store:', JSON.stringify(sampleData, null, 2));
console.log('Movie ID:', movieId);

// Instructions:
// 1. Make sure you have BLOB_READ_WRITE_TOKEN in your .env.local
// 2. Run this test with: node test-blob-data.js
// 3. Or use the API endpoint directly:
//    curl -X POST http://localhost:3000/api/videos \
//      -H "Content-Type: application/json" \
//      -d '{"movieId": "1363123", "videos": [{"name": "Serveur 1", "url": "https://api-stream.ztvplus.workers.dev/player?url=https://lb.daisukianime.xyz/dist/embedv.html?id=yvcnj9vnu5f4&asi=1&time=0", "lang": "vostfr", "quality": "1080p", "pub": 0}, {"name": "Serveur 2", "url": "https://example.com/video-serveur2", "lang": "vf", "quality": "720p", "pub": 1}]}'

// To test retrieval:
// curl "http://localhost:3000/api/videos?id=1363123"
