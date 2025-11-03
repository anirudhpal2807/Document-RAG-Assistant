import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file: File | null = formData.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check if file is PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadsDir = join(process.cwd(), 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    
    const filePath = join(uploadsDir, file.name);
    await writeFile(filePath, buffer);

    // Load PDF using LangChain
    const pdfLoader = new PDFLoader(filePath);
    const rawDocs = await pdfLoader.load();

    // Split into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

    // Initialize embeddings
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'text-embedding-004',
    });

    // Initialize Pinecone
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndexName = process.env.PINECONE_INDEX_NAME;

    if (!pineconeApiKey || !pineconeIndexName) {
      return NextResponse.json(
        { error: 'Pinecone credentials not configured' },
        { status: 500 }
      );
    }

    const pinecone = new Pinecone({
      apiKey: pineconeApiKey,
    });

    const pineconeIndex = pinecone.Index(pineconeIndexName);

    // Upload to Pinecone
    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });

    return NextResponse.json({
      success: true,
      message: 'Document uploaded and processed successfully',
      pages: rawDocs.length,
      chunks: chunkedDocs.length,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process PDF' },
      { status: 500 }
    );
  }
}

