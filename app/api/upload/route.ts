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
    console.log('1. Loading PDF with PDFLoader...');
    const pdfLoader = new PDFLoader(filePath);
    const rawDocs = await pdfLoader.load();
    console.log(`2. PDF loaded successfully. Pages: ${rawDocs.length}`);

    // Split into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    console.log('3. Splitting text into chunks...');
    let chunkedDocs = await textSplitter.splitDocuments(rawDocs);
    
    // Filter out chunks with empty or only whitespace/null content
    chunkedDocs = chunkedDocs.filter(doc => {
      if (!doc.pageContent) return false;
      const cleanText = doc.pageContent.replace(/\0/g, '').trim();
      if (cleanText.length > 0) {
        doc.pageContent = cleanText; // Clean the content for Pinecone
        doc.metadata = { ...doc.metadata, fileName: file.name };
        return true;
      }
      return false;
    });
    
    if (chunkedDocs.length === 0) {
      return NextResponse.json(
        { error: 'No readable text found in the uploaded PDF. Ensure it contains actual text and not just scanned images.' },
        { status: 400 }
      );
    }

    console.log(`4. Text splitted into ${chunkedDocs.length} valid chunks.`);

    // Initialize embeddings
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API key is missing!');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log('5. Initializing Google Embeddings...');
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey,
      model: 'gemini-embedding-001', // Changed model since text-embedding-004 gives 404
      maxRetries: 1,
    }); // NOTE: This model returns 3072 dimensions! You will need to recreate your Pinecone index with 3072 dimensions.

    // Initialize Pinecone
    const pineconeApiKey = process.env.PINECONE_API_KEY;
    const pineconeIndexName = process.env.PINECONE_INDEX_NAME;

    if (!pineconeApiKey || !pineconeIndexName) {
      console.error('Pinecone credentials missing!');
      return NextResponse.json(
        { error: 'Pinecone credentials not configured' },
        { status: 500 }
      );
    }

    console.log('6. Initializing Pinecone...');
    const pinecone = new Pinecone({
      apiKey: pineconeApiKey,
    });

    const pineconeIndex = pinecone.Index(pineconeIndexName);

    // Upload to Pinecone
    console.log(`7. Uploading ${chunkedDocs.length} chunks to Pinecone... (This may take a while)`);
    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });
    console.log('8. Upload to Pinecone complete!');

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

