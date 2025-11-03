// pdf loader: end-to-end flow to read a PDF and split it into chunks
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Ensure .env is loaded from this file's directory, not the shell's CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Early validation for required env vars
const requiredEnvVars = {
  'Google/Gemini API Key': process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
  'Pinecone API Key': process.env.PINECONE_API_KEY,
  'Pinecone Index Name': process.env.PINECONE_INDEX_NAME,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error(`❌ Error: Missing required environment variables: ${missingVars.join(', ')}.`);
  console.error(`Please set them in your .env file at: ${join(__dirname, '.env')}`);
  console.error("\nExample .env file content:");
  console.error("GEMINI_API_KEY=your_gemini_api_key_here");
  console.error("PINECONE_API_KEY=your_pinecone_api_key_here");
  console.error("PINECONE_INDEX_NAME=your_pinecone_index_name_here");
  process.exit(1);
}

// import: loader to read PDFs into LangChain Document objects
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
// import: used to verify the file exists and report its size
import { stat } from 'node:fs/promises';
// import: chunking utility to split long text into overlapping segments
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';

async function main() {
  const PDF_PATH = './dsa.pdf';

  try {
    // log: where the file is being loaded from
    console.log('Starting PDF load from:', PDF_PATH);

    // check: confirm PDF is accessible and get size for quick diagnostics
    const fileInfo = await stat(PDF_PATH);
    console.log('PDF size (bytes):', fileInfo.size);

    // load: read the PDF into an array of LangChain Documents (one per page)
    const pdfLoader = new PDFLoader(PDF_PATH);
    const rawDocs = await pdfLoader.load();

    // log: number of pages loaded and a small preview to validate content
    console.log(
      'Loaded pages:',
      Array.isArray(rawDocs) ? rawDocs.length : 'unknown'
    );
    if (Array.isArray(rawDocs) && rawDocs.length > 0) {
      const first = rawDocs[0];
      console.log(
        'First page snippet:',
        String(first.pageContent || '').slice(0, 200)
      );
    }

    // chunk: split pages into overlapping text chunks for downstream RAG usage
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

    // log: total number of generated chunks
    console.log('Chunks:', chunkedDocs.length);

    // embeddings (Google Gemini)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'text-embedding-004',
    });

    // init Pinecone client
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    // upload embeddings + docs to Pinecone
    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });

    console.log('✅ Data loaded successfully into Pinecone');
  } catch (error) {
    // error: surface a clear message if any step fails
    console.error('❌ Error loading PDF:', error?.message || error);
    process.exitCode = 1;
  }
}

main();
