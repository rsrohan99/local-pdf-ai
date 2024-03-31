In this tutorial we'll build a fully local chat-with-pdf app using LlamaIndexTS, Ollama, Next.JS.


https://github.com/rsrohan99/local-pdf-ai/assets/62835870/6f2497ea-15b4-47ea-9482-dade56434b2b


Stack used:
- **LlamaIndex TS** as the RAG framework
- **Ollama** to locally run LLM and embed models
- **nomic-text-embed** with Ollama as the embed model
- **phi2** with Ollama as the LLM
- **Next.JS** with **server actions**
- **PDFObject** to preview PDF with auto-scroll to relevant page
- **LangChain** WebPDFLoader to parse the PDF

### Install Ollama

We'll use Ollama to run the embed models and llms locally.

Install Ollama

```bash
$ curl -fsSL https://ollama.com/install.sh | sh
```

### Download nomic and phi model weights

For this guide, I've used `phi2` as the LLM and `nomic-embed-text` as the embed model.

To use the model, first we need to download their weights.

```bash
$ ollama pull phi

$ ollama pull nomic-embed-text
```

But feel free to use any model you want.

### `FilePicker.tsx` - Drag-n-drop the PDF

This component is the entry-point to our app.

It's used for uploading the pdf file, either clicking the upload button or drag-and-drop the PDF file.

```ts
  return (
    <div
      className='flex flex-col gap-7 justify-center items-center h-[80vh]'>
      <Label htmlFor="pdf" className="text-xl font-bold tracking-tight text-gray-600 cursor-pointer">
        Select PDF to chat
      </Label>
      <Input
        onDragOver={() => setStatus("Drop PDF file to chat")}
        onDragLeave={() => setStatus("")}
        onDrop={handleFileDrop}
        id="pdf"
        type="file"
        accept='.pdf'
        className="cursor-pointer"
        onChange={(e) => {
          if (e.target.files) {
            setSelectedFile(e.target.files[0])
            setPage(1)
          }
        }}
      />
      <div className="text-lg font-medium">{status}</div>
    </div>
  )
```
After successfully upload, it sets the state variable `selectedFile` to the newly uploaded file.


### `Preview.tsx` - Preview of the PDF

Once the state variable `selectedFile` is set, `ChatWindow` and `Preview` components are rendered instead of `FilePicker`

First we get the base64 string of the pdf from the `File` using `FileReader`. Next we use this base64 string to preview the pdf.

Preview component uses `PDFObject` package to render the PDF.

It also takes `page` as prop to scroll to the relevant page. It's set to 1 initially and then updated as we chat with the PDF.

```ts
  useEffect(() => {
    const options = {
      title: fileToPreview.name,
      pdfOpenParams: {
        view: "fitH",
        page: page || 1,
        zoom: "scale,left,top",
        pageMode: 'none'
      }
    }
    console.log(`Page: ${page}`)
    const reader = new FileReader()
    reader.onload = () => {
      setb64String(reader.result as string);
    }
    reader.readAsDataURL(fileToPreview)
    pdfobject.embed(b64String as string, "#pdfobject", options)
  }, [page, b64String])

  return (
    <div className="flex-grow roundex-xl" id="pdfobject">
    </div>
  )
```


### `ProcessPDF()` Next.JS server action

We also have to process the PDF for RAG.

We first use `LangChain` `WebPDFLoader` to parse the uploaded PDF. We use `WebPDFLoader` because it runs on the browser and don't require node.js.

```ts
const loader = new WebPDFLoader(
  selectedFile,
  { parsedItemSeparator: " " }
);
const lcDocs = (await loader.load()).map(lcDoc => ({
  pageContent: lcDoc.pageContent,
  metadata: lcDoc.metadata,
}))
```

### RAG using LlamaIndex TS

Next, we pass the parsed documents to a Next.JS server action that initiates the RAG pipeline using `LlamaIndex TS`
```ts
if (lcDocs.length == 0) return;
const docs = lcDocs.map(lcDoc => new Document({
    text: lcDoc.pageContent,
    metadata: lcDoc.metadata
}))
```
we create LlamaIndex Documents from the parsed documents.

#### Vector Store Index

Next we create a `VectorStoreIndex` with those Documents, passing configuration info like which embed model and llm to use.
```ts
  const index = await VectorStoreIndex.fromDocuments(docs, {
    serviceContext: serviceContextFromDefaults({
      chunkSize: 300,
      chunkOverlap: 20,
      embedModel, llm
    })
  })
```

We use Ollama for LLM and OllamaEmbedding for embed model

```ts
const embedModel = new OllamaEmbedding({
  model: 'nomic-embed-text'
})

const llm = new Ollama({
  model: "phi",
  modelMetadata: {
    temperature: 0,
    maxTokens: 25,
  }
})
```

#### Vector Index Retriever
We then create a `VectorIndexRetriever` from the `index`, which will be used to create a chat engine.
```ts
  const retriever = index.asRetriever({
    similarityTopK: 2,
  })
  if (chatEngine) {
    chatEngine.reset()
  }
```

#### ChatEngine
Finally, we create a LlamaIndex `ContextChatEngine` from the `Retriever`
```ts
  chatEngine = new ContextChatEngine({
    retriever,
    chatModel: llm
  })
```
we pass in the LLM as well.

### `ChatWindow.tsx`
This component is used to handle the Chat Logic
```ts
  <ChatWindow
    isLoading={isLoading}
    loadingMessage={loadingMessage}
    startChat={startChat}
    messages={messages}
    setSelectedFile={setSelectedFile}
    setMessages={setMessages}
    setPage={setPage}
  />
```

### `chat()` server action
This server action used the previously created `ChatEngine` to generate chat response.

In addition to the text response it also returns the source nodes used to generate the response, which we'll use later to updated which page to show on the PDF preview.

```ts
const queryResult = await chatEngine.chat({
  message: query
})
const response = queryResult.response
const metadata = queryResult.sourceNodes?.map(node => node.metadata)
return { response, metadata };
```

### Update the page to preview from metadata

We use the response and metadata from the above server action (`chat()`) to update the messages, and update the page to show in the PDF preview.

```ts
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
```

### Few gotchas

There're a few things to consider for this project:
- You'll need a powerful machine with decent GPU to run Ollama for faster and better responses.
- We need to disable `fs` on `browser` otherwise `pdf-parse` will not work. We need to put this in the `webpack` section of `next.config.js`
```ts
if (!isServer) {
  config.resolve.fallback = {
    fs: false,
    "node:fs/promises": false,
    assert: false,
    module: false,
    perf_hooks: false,
  };
}
```
- Next.JS server actions don't support sending intermediate results, hence couldn't make streaming work.


Thanks for reading. Stay tuned for more.

I tweet about these topics and anything I'm exploring on a regular basis.
[Follow me on twitter](https://twitter.com/clusteredbytes)

