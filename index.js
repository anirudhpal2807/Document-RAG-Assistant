
// pdf loader: end-to-end flow to read a PDF and split it into chunks

// import: loader to read PDFs into LangChain Document objects
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// import: used to verify the file exists and report its size
import { stat } from 'node:fs/promises';
// import: chunking utility to split long text into overlapping segments
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

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
    console.log('Loaded pages:', Array.isArray(rawDocs) ? rawDocs.length : 'unknown');
    if (Array.isArray(rawDocs) && rawDocs.length > 0) {
      const first = rawDocs[0];
      console.log('First page snippet:', String(first.pageContent || '').slice(0, 200));
    }

    // chunk: split pages into overlapping text chunks for downstream RAG usage
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
    // log: total number of generated chunks
    console.log('Chunks:', chunkedDocs.length);
  } catch (error) {
    // error: surface a clear message if any step fails
    console.error('Error loading PDF:', error?.message || error);
    process.exitCode = 1;
  }

}

main();

//chunking

