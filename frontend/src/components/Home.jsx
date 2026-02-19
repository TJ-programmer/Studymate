import { useEffect, useRef, useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { Document, Page, pdfjs } from "react-pdf"
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url"

import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

function Home() {
  const [theme, setTheme] = useState("light")

  // PDF states
  const [file, setFile] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfWidth, setPdfWidth] = useState(0)

  const pdfContainerRef = useRef(null)

  // Theme load
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      const initialTheme = systemDark ? "dark" : "light"
      setTheme(initialTheme)
      document.documentElement.classList.toggle("dark", initialTheme === "dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  // Resize observer for responsive PDF width
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const width = entries[0].contentRect.width
        setPdfWidth(width - 16) // padding adjustment
      }
    })

    if (pdfContainerRef.current) {
      observer.observe(pdfContainerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Restore PDF from localStorage on mount
  useEffect(() => {
    try {
      const savedPdf = localStorage.getItem("pdf_data")
      const savedName = localStorage.getItem("pdf_name")
      const savedPage = localStorage.getItem("pdf_page")

      if (savedPdf && savedName) {
        // Convert base64 data URL back to a File object
        fetch(savedPdf)
          .then((res) => res.blob())
          .then((blob) => {
            const restored = new File([blob], savedName, { type: "application/pdf" })
            setFile(restored)
            if (savedPage) setPageNumber(parseInt(savedPage, 10))
          })
      }
    } catch (err) {
      console.warn("Could not restore PDF from localStorage", err)
    }
  }, [])

  // Persist page number whenever it changes
  useEffect(() => {
    if (file) {
      localStorage.setItem("pdf_page", String(pageNumber))
    }
  }, [pageNumber, file])

  // PDF handlers
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    // Don't reset to page 1 here — let restored page persist
  }

  const nextPage = () => setPageNumber((p) => Math.min(p + 1, numPages))
  const prevPage = () => setPageNumber((p) => Math.max(p - 1, 1))

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Read as base64 and persist to localStorage
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        localStorage.setItem("pdf_data", event.target.result)
        localStorage.setItem("pdf_name", selectedFile.name)
        localStorage.setItem("pdf_page", "1")
      } catch (err) {
        console.warn("PDF too large to store in localStorage", err)
      }
    }
    reader.readAsDataURL(selectedFile)

    setFile(selectedFile)
    setPageNumber(1)
  }

  const closePdf = () => {
    setFile(null)
    setNumPages(null)
    setPageNumber(1)
    localStorage.removeItem("pdf_data")
    localStorage.removeItem("pdf_name")
    localStorage.removeItem("pdf_page")
  }

  return (
    <div className="h-screen w-screen p-4 bg-gradient-to-br from-indigo-100 via-sky-100 to-purple-100 
    dark:from-[#0f172a] dark:via-[#020617] dark:to-[#020617] animate-gradient-x transition-colors duration-500">

      <div className="h-full w-full rounded-3xl border border-indigo-100/60 dark:border-white/10 
      bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.15)] 
      overflow-hidden transition-all duration-300">

        <ResizablePanelGroup direction="horizontal" className="h-full w-full">

          {/* 📚 LEFT PANEL – PDF VIEWER */}
          <ResizablePanel
            defaultSize={50}
            minSize={18}
            className="flex flex-col min-h-0 bg-gradient-to-b from-indigo-50/80 to-white/60 
            dark:from-white/5 dark:to-white/0 backdrop-blur-md"
          >

            {/* HEADER */}
            <div className="shrink-0 border-b border-indigo-100/70 dark:border-white/10 
            px-4 py-3 font-semibold text-indigo-700 dark:text-indigo-300 
            backdrop-blur-sm bg-white/40 dark:bg-white/5 z-10">
              📚 Materials
            </div>

            {/* BODY */}
            <div className="flex-1 flex flex-col p-2 gap-2 min-h-0 overflow-hidden">

              {/* Upload UI */}
              {!file && (
                <label
                  className="flex-1 flex flex-col items-center justify-center gap-3
                  border-2 border-dashed border-indigo-300/70 dark:border-white/20
                  rounded-2xl cursor-pointer
                  bg-white/40 dark:bg-white/5
                  hover:bg-indigo-50/70 dark:hover:bg-white/10
                  transition-all text-center px-4"
                >
                  <div className="text-3xl">📄</div>
                  <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    Upload your PDF
                  </div>
                  <div className="text-[11px] text-indigo-500 dark:text-indigo-400">
                    Click to browse
                  </div>

                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}

              {/* PDF VIEW */}
              {file && (
                <>
                  {/* FILE BAR */}
                  <div className="shrink-0 w-full flex items-center justify-between
                  text-[11px] px-2 py-1 rounded-lg
                  bg-indigo-50 dark:bg-white/5
                  text-indigo-700 dark:text-indigo-300">
                    <span className="truncate max-w-[140px]">{file.name}</span>
                    <button
                      onClick={closePdf}
                      className="px-2 py-[2px] rounded-md
                      bg-red-100 dark:bg-red-500/20
                      text-red-600 dark:text-red-300"
                    >
                      ✕
                    </button>
                  </div>

                  {/* PDF CONTAINER — flex-1 + min-h-0 keeps it from overflowing */}
                  <div
                    ref={pdfContainerRef}
                    className="flex-1 min-h-0 overflow-auto w-full flex justify-center
                    bg-white/40 dark:bg-white/5 rounded-xl p-2"
                  >
                    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                      <Page
                        pageNumber={pageNumber}
                        width={pdfWidth}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>
                  </div>

                  {/* CONTROLS — always visible, pinned at bottom */}
                  <div className="shrink-0 flex items-center justify-between w-full
                  px-1 py-1 text-xs text-indigo-700 dark:text-indigo-300">
                    <button
                      onClick={prevPage}
                      disabled={pageNumber <= 1}
                      className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-white/10 
                      disabled:opacity-30 hover:bg-indigo-200 dark:hover:bg-white/20 
                      transition-colors font-medium"
                    >
                      ‹ Prev
                    </button>

                    <span className="text-[11px] tabular-nums">
                      {pageNumber} / {numPages || "--"}
                    </span>

                    <button
                      onClick={nextPage}
                      disabled={pageNumber >= numPages}
                      className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-white/10 
                      disabled:opacity-30 hover:bg-indigo-200 dark:hover:bg-white/20 
                      transition-colors font-medium"
                    >
                      Next ›
                    </button>
                  </div>
                </>
              )}
            </div>
          </ResizablePanel>

          {/* HANDLE */}
          <ResizableHandle withHandle />

          {/* 🤖 RIGHT PANEL */}
          <ResizablePanel defaultSize={50} minSize={40} className="flex flex-col">

            {/* HEADER */}
            <div className="border-b border-indigo-100/70 dark:border-white/10 
            px-6 py-4 flex items-center justify-between">

              <h1 className="font-semibold text-indigo-700 dark:text-indigo-300">
                🤖 Ai Chat
              </h1>

              {/* 💡 LAMP TOGGLE */}
              <div className="relative flex items-start justify-center w-16 h-12">
                <div
                  className={`absolute top-4 h-24 w-24 rounded-full blur-2xl transition-all duration-500 ${
                    theme === "dark" ? "bg-yellow-300/20" : "bg-indigo-300/20"
                  }`}
                />

                <button
                  onClick={toggleTheme}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  <div className="w-[2px] h-6 bg-gray-400 dark:bg-gray-500 group-active:h-9" />
                  <div className="w-3 h-3 rounded-full bg-gray-500 dark:bg-gray-400 group-active:translate-y-1" />
                </button>

                <div
                  className={`absolute top-6 w-10 h-6 rounded-b-full border
                  ${theme === "dark"
                    ? "bg-yellow-200 shadow-[0_0_25px_rgba(250,204,21,0.6)]"
                    : "bg-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                  }`}
                />
              </div>
            </div>

            <div className="flex-1 p-2" />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default Home