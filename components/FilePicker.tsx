
'use client'

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dispatch, SetStateAction } from "react"

interface FilePickerProps {
  setSelectedFile: Dispatch<SetStateAction<File | null>>
}

const FilePicker: React.FC<FilePickerProps> = ({
  setSelectedFile,
}) => {
  return (
    <div
      className='flex flex-col gap-7 justify-center items-center h-[80vh]'>
      <Label htmlFor="pdf" className="text-xl font-bold tracking-tight text-gray-600 cursor-pointer">
        Select or Drag-and-drop PDF to chat
      </Label>
      <Input
        id="pdf"
        type="file"
        accept='.pdf'
        className="cursor-pointer"
        onChange={(e) => e.target.files ? setSelectedFile(e.target.files[0]) : null}
      />
    </div>
  )
}

export default FilePicker
