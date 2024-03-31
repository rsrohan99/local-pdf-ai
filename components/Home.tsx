'use client'

import { useState, useEffect } from "react"
import FilePicker from "@/components/FilePicker";
import ChatWindow from '@/components/ChatWindow';
import Preview from '@/components/Preview';
import { WebPDFLoader } from "langchain/document_loaders/web/pdf"

import { processDocs, chat } from "@/app/actions";
import { ChatMessage } from "@/components/ChatWindow";


export default function HomePage() {

  const [page, setPage] = useState(1)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")

  const [messages, setMessages] = useState<ChatMessage[]>([])

  const startChat = async (input: string) => {
    setLoadingMessage("Thinking...")
    setIsLoading(true)
    try {
      setMessages([...messages, { role: 'human', statement: input },])
      const { response, metadata } = await chat(input);
      setMessages(
        [
          ...messages,
          { role: 'human', statement: input },
          { role: 'ai', statement: response }
        ]
      )
      // console.log(metadata)
      if (metadata.length > 0) {
        setPage(metadata[0].loc.pageNumber)
      }
      setLoadingMessage("Got response from AI.")
    } catch (e) {
      console.log(e)
      setLoadingMessage("Error generating response.")
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    setLoadingMessage("Creating Index from the PDF...")
    setIsLoading(true);
    const processPdfAsync = async () => {
      if (selectedFile) {
        const loader = new WebPDFLoader(
          selectedFile,
          { parsedItemSeparator: " " }
        );
        const lcDocs = (await loader.load()).map(lcDoc => ({
          pageContent: lcDoc.pageContent,
          metadata: lcDoc.metadata,
        }))
        try {
          await processDocs(lcDocs)
          setLoadingMessage("Done creating Index from the PDF.")
        } catch (e) {
          console.log(e)
          setLoadingMessage("Error while creating index")
        } finally {
          setIsLoading(false);
        }
      }
    }
    processPdfAsync()
    // console.log(selectedFile)
  }, [selectedFile])

  return (
    <div>
      {selectedFile ? (
        <div className='flex justify-evenly gap-2 h-[90vh]'>
          <ChatWindow
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            startChat={startChat}
            messages={messages}
            setSelectedFile={setSelectedFile}
            setMessages={setMessages}
            setPage={setPage}
          />
          <Preview fileToPreview={selectedFile} page={page} />
        </div>
      ) : (
        <FilePicker
          setPage={setPage}
          setSelectedFile={setSelectedFile} />
      )}
    </div>
  )
}
