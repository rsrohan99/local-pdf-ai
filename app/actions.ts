'use server'

import { Document } from "llamaindex/Node"
import { VectorStoreIndex } from "llamaindex/indices/vectorStore/index"
import { ContextChatEngine } from "llamaindex/engines/chat/ContextChatEngine"
import { OllamaEmbedding } from "llamaindex/embeddings/OllamaEmbedding"
import { serviceContextFromDefaults } from "llamaindex/ServiceContext"
import { Ollama } from "llamaindex/llm/ollama"

interface LCDoc {
  pageContent: string,
  metadata: any,
}

const embedModel = new OllamaEmbedding({
  model: 'nomic-embed-text'
})

const llm = new Ollama({
  model: "phi",
  // model: "gemma",
  modelMetadata: {
    temperature: 0,
    maxTokens: 25,
  }
})

let chatEngine: ContextChatEngine | null = null;

export async function processDocs(lcDocs: LCDoc[]) {
  if (lcDocs.length == 0) return;
  const docs = lcDocs.map(lcDoc => new Document({
    text: lcDoc.pageContent,
    metadata: lcDoc.metadata
  }))

  // console.log(docs)
  const index = await VectorStoreIndex.fromDocuments(docs, {
    serviceContext: serviceContextFromDefaults({
      chunkSize: 300,
      chunkOverlap: 20,
      embedModel, llm
    })
  })
  const retriever = index.asRetriever({
    similarityTopK: 2,
  })
  if (chatEngine) {
    chatEngine.reset()
  }
  chatEngine = new ContextChatEngine({
    retriever,
    chatModel: llm
  })
  // console.log("Done creating index with the new PDF")
}


export async function chat(query: string) {
  if (chatEngine) {
    const queryResult = await chatEngine.chat({
      message: query
    })
    const response = queryResult.response
    const metadata = queryResult.sourceNodes?.map(node => node.metadata)
    // const nodesText = queryResult.sourceNodes?.map(node => node.getContent(MetadataMode.LLM))
    return { response, metadata };
  }
}

export async function resetChatEngine() {
  if (chatEngine) chatEngine.reset();
}
