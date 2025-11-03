import * as dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import readlineSync from 'readline-sync';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';

// Load .env from this file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Read env vars (support GOOGLE_API_KEY or GEMINI_API_KEY)
const GOOGLE_OR_GEMINI_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME;

if (!GOOGLE_OR_GEMINI_KEY || !PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
  console.error('❌ Missing env vars. Required: GOOGLE_API_KEY or GEMINI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME');
  process.exit(1);
}

// Initialize clients
const ai = new GoogleGenAI({ apiKey: GOOGLE_OR_GEMINI_KEY });
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: GOOGLE_OR_GEMINI_KEY,
  model: 'text-embedding-004',
});
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const pineconeIndex = pinecone.Index(PINECONE_INDEX_NAME);

const History = [];

async function chatting(question) {
  // 1) Embed the user question
  const queryVector = await embeddings.embedQuery(question);

  // 2) Vector search in Pinecone
  const searchResults = await pineconeIndex.query({
    topK: 10,
    vector: queryVector,
    includeMetadata: true,
  });

  const context = (searchResults.matches || [])
    .map(match => String(match?.metadata?.text || ''))
    .filter(Boolean)
    .join('\n\n---\n\n');

  // 3) Build conversation history and ask Gemini
  History.push({ role: 'user', parts: [{ text: question }] });

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: History,
    config: {
      systemInstruction: `You have to behave like a Data Structure and Algorithm Expert.
You will be given a context of relevant information and a user question.
Your task is to answer the user's question based ONLY on the provided context.
If the answer is not in the context, you must say "I could not find the answer in the provided document."
Keep your answers clear, concise, and educational.

Context: ${context}
`,
    },
  });

  const text = response?.text || 'No response text.';
  History.push({ role: 'model', parts: [{ text }] });
  console.log('\n');
  console.log(text);
}

async function main() {
  const userProblem = readlineSync.question('Ask me anything--> ');
  await chatting(userProblem);
  return main();
}

main();