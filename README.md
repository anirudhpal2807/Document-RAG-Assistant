# Document RAG Assistant

A Next.js application that allows users to upload PDF documents and ask questions about them using AI-powered RAG (Retrieval-Augmented Generation).

## Features

- 📄 Upload PDF documents
- 🤖 AI-powered question answering using Google Gemini
- 🔍 Semantic search using Pinecone vector database
- 💬 Interactive chat interface
- 🎨 Modern, responsive UI with Tailwind CSS

## Prerequisites

- Node.js 18+ installed
- Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
- Pinecone account and API key ([Get one here](https://www.pinecone.io/))
- Pinecone index created

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PINECONE_API_KEY=your_pinecone_api_key_here
   PINECONE_INDEX_NAME=your_pinecone_index_name_here
   ```

   Note: You can also use `GOOGLE_API_KEY` instead of `GEMINI_API_KEY`.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload a Document:**
   - Click on the upload area or drag and drop a PDF file
   - Wait for the document to be processed and indexed

2. **Ask Questions:**
   - Type your question in the chat interface
   - The AI will search through your uploaded documents and provide answers
   - You can ask multiple questions in a conversation

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── upload/      # API route for document upload
│   │   └── query/        # API route for question answering
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main page
│   └── globals.css       # Global styles
├── components/
│   ├── DocumentUpload.tsx    # Upload component
│   └── ChatInterface.tsx     # Chat component
├── uploads/              # Temporary PDF storage (auto-created)
├── index.js              # Legacy PDF loader script
└── query.js              # Legacy query script
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run legacy:load-pdf` - Run legacy PDF loader
- `npm run legacy:query` - Run legacy query interface

## Technology Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Gemini** - LLM and embeddings
- **Pinecone** - Vector database
- **LangChain** - Document processing

## Notes

- Only PDF files are supported for upload
- Large PDFs may take some time to process
- The uploaded files are stored temporarily in the `uploads/` directory
- Make sure your Pinecone index has sufficient capacity for your documents

