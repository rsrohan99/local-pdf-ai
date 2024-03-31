'use client'

import { useState } from "react"
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

  const reader = new FileReader()
  reader.onload = () => {
    setb64String(reader.result as string);
  }
  reader.readAsDataURL(fileToPreview)
  // useEffect(() => {
  //   console.log(`Page: ${page}`)
  // }, [page])
  // useEffect(() => {
  //   console.log(b64String)
  // }, [b64String])
  const options = {
    title: fileToPreview.name,
    pdfOpenParams: {
      view: "fitH",
      page: page || 1,
      zoom: "scale,left,top",
      pageMode: 'none'
    }
  }
  pdfobject.embed(b64String as string, "#pdfobject", options)
  return (
    <div className="flex-grow roundex-xl" id="pdfobject">
      {/* <PDFObject */}
      {/*   url={b64String as string} */}
      {/*   page={page || 1} */}
      {/*   height="90vh" */}
      {/*   pdfOpenParams={{ */}
      {/*     view: "FitH", */}
      {/*     zoom: "scale,left,top" */}
      {/*   }} */}
      {/* /> */}
    </div>
  )
}

export default Preview
