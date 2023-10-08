# Storyteller

StoryTeller is am exploratory web application that creates short audio stories for pre-school kids.

## Development

1. Install dependencies: `npm i`
1. Setup `.env` with required keys:

   ```
    OPENAI_API_KEY="sk-..."
    ELEVENLABS_API_KEY="..."
    LMNT_API_KEY="..."
    STABILITY_API_KEY="sk-..."
   ```

   You can get the API keys from the respective services:

   - [OpenAI](https://platform.openai.com/)
   - [Eleven Labs](https://elevenlabs.io/)
   - [Lmnt](https://lmnt.com/)
   - [Stability](https://platform.stability.ai/)

1. Start Fastify server (runs on port 3001): `npm run fastify`
1. Start Next.js server for UI (runs on port 3000): `npm run next`
1. Go to [localhost:3000](http://localhost:3000)

## Deployment

1. Build the Next.js app: `npm run build`. This exports the app to the `out` folder, so it can be served by Fastify.

## Limitations

- No persistent execution with error handling
- No user accounts / persistent data (only storage of image and audio files)
- No user authentication / authorization
- Limited error handling on the client
