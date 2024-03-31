'use client'

import { useState, useEffect } from "react"
import * as pdfobject from "pdfobject"

interface PreviewProps {
  fileToPreview: File
  page?: number
}

const Preview: React.FC<PreviewProps> = ({
  fileToPreview,
  page
}) => {

  const [b64String, setb64String] = useState<string | null>(null)


  // useEffect(() => {
  //   console.log(b64String)
  // }, [b64String])
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
}

export default Preview
