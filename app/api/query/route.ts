import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { question, history = [] } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // In Next.js, env vars need NEXT_PUBLIC_ prefix for client-side, but for server-side API routes, use without prefix
    // However, Next.js automatically loads .env.local and .env files
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndexName = process.env.PINECONE_INDEX_NAME;

    if (!apiKey || !pineconeApiKey || !pineconeIndexName) {
      console.error('Missing env vars:', {
        hasApiKey: !!apiKey,
        hasPineconeKey: !!pineconeApiKey,
        hasIndexName: !!pineconeIndexName,
      });
      return NextResponse.json(
        { error: 'API keys not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    // Initialize clients
    const ai = new GoogleGenAI({ apiKey });
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'text-embedding-004',
    });
    const pinecone = new Pinecone({ apiKey: pineconeApiKey });
    const pineconeIndex = pinecone.Index(pineconeIndexName);

    // Embed the question
    const queryVector = await embeddings.embedQuery(question);

    // Search in Pinecone
    const searchResults = await pineconeIndex.query({
      topK: 10,
      vector: queryVector,
      includeMetadata: true,
    });

    // Build context from search results
    const context = (searchResults.matches || [])
      .map((match) => String(match?.metadata?.text || ''))
      .filter(Boolean)
      .join('\n\n---\n\n');

    // If no context found, inform the user
    if (!context || context.trim().length === 0) {
      return NextResponse.json({
        answer: 'I could not find any relevant information in the uploaded documents to answer your question. Please make sure documents are uploaded and indexed, or try rephrasing your question.',
        sources: [],
      });
    }

    // Build conversation history - include previous messages if any
    const conversationHistory = [
      ...history,
      { role: 'user', parts: [{ text: question }] },
    ];

    // Generate response using Gemini
    // Context is included in system instruction, and conversation history in contents
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: conversationHistory,
      config: {
        systemInstruction: `You are a helpful AI assistant with access to document context.
You will be given a context of relevant information from uploaded documents and a user question.
Your task is to answer the user's question based on the provided context.
If the answer is not in the context, you must say "I could not find the answer in the provided document."
Keep your answers clear, concise, and educational.
Always cite the relevant parts when possible.

Context from documents:
${context}`,
      },
    });

    const text = response?.text || 'No response generated.';

    return NextResponse.json({
      answer: text,
      sources: searchResults.matches?.slice(0, 3).map((match) => ({
        score: match.score,
        text: String(match.metadata?.text || '').slice(0, 200),
      })) || [],
    });
  } catch (error: any) {
    console.error('Error processing query:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { 
        error: error?.message || 'Failed to process query',
        details: error?.stack || String(error)
      },
      { status: 500 }
    );
  }
}

