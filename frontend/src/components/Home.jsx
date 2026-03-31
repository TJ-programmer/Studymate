import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { RotateCw , Bolt, GripVertical} from 'lucide-react';
import { FaYoutube } from "react-icons/fa";
import { Document, Page, pdfjs } from "react-pdf"
import workerSrc from "pdfjs-dist/build/pdf.worker.min?url"
import { Lightbulb } from "@theme-toggles/react"
import "@theme-toggles/react/css/Lightbulb.css"


import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

function Home() {
  const [theme, setTheme] = useState("light")

  // PDF states
  const [scale, setScale] = useState(1)
  const [file, setFile] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfWidth, setPdfWidth] = useState(0)
  const [searchText, setSearchText] = useState("")
  const [matchPositions, setMatchPositions] = useState([])
  const [currentMatch, setCurrentMatch] = useState(0)
  const [pdfTextIndex, setPdfTextIndex] = useState({})
  const [ragavailable,setRagAvailable] = useState(false)
  
  const pageMatchCounter = useRef(0)
  const pdfContainerRef = useRef(null)
  const panelGroupRef = useRef(null)
  const [panelLayout, setPanelLayout] = useState([50, 50])
  const [panelDefaults, setPanelDefaults] = useState([50, 50])
  const [layoutVersion, setLayoutVersion] = useState(0)
  const PANEL_LEFT_MIN = 18
  const PANEL_LEFT_MAX = 60

  //chat state 
  const [messages,setMessages] = useState([])
  const [chatInput,setChatInput] = useState("")
  const [isSending,setIsSending] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const chatBottomRef = useRef(null)
  const streamAbortRef = useRef(null)
  const streamBufferRef = useRef("")
  const streamFrameRef = useRef(null)
  const hasLoadedChat = useRef(false)


  //rag control state
  const [open, setOpen] = useState(false)
  const iconRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  // YouTube panel state
  const [ytPanelOpen, setYtPanelOpen] = useState(false)
  const [ytQuery, setYtQuery] = useState("")
  const [ytLoading, setYtLoading] = useState(false)
  const [ytResults, setYtResults] = useState(null)
  const [ytError, setYtError] = useState(null)
  const ytPanelRef = useRef(null)
  const chatVideoContainerRef = useRef(null)

  // In-app player state
  const [inAppVideoUrl, setInAppVideoUrl] = useState(null)
  const [chatPanelHeight, setChatPanelHeight] = useState(58)
  const [isDraggingPlayerSplit, setIsDraggingPlayerSplit] = useState(false)

  // ADD THESE:
  const [mode, setMode] = useState("single")
  const [singlePage, setSinglePage] = useState(1)
  const [range, setRange] = useState({ start: 1, end: 5 })


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

  useEffect(() => {
    const savedVideoUrl = localStorage.getItem("studymate_inapp_video")
    if (savedVideoUrl) {
      setInAppVideoUrl(savedVideoUrl)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const escapeHtml = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")

  const highlightText = (textItem) => {
    if (!searchText) return textItem.str

    const regex = new RegExp(escapeRegExp(searchText), "gi")
    let lastIndex = 0
    let rendered = ""
    let match

    while ((match = regex.exec(textItem.str)) !== null) {
      const start = match.index
      const end = start + match[0].length
      const currentOnPage = pageMatchCounter.current++
      const activeMatch = matchPositions[currentMatch]
      const activeMatchOnPageIndex =
        activeMatch?.page === pageNumber
          ? matchPositions
              .slice(0, currentMatch + 1)
              .filter((m) => m.page === pageNumber).length - 1
          : -1
      const isActive = currentOnPage === activeMatchOnPageIndex

      rendered += escapeHtml(textItem.str.slice(lastIndex, start))
      rendered += isActive
        ? `<mark class="bg-orange-400 text-black px-[1px] rounded">${escapeHtml(match[0])}</mark>`
        : escapeHtml(match[0])

      lastIndex = end

      if (regex.lastIndex === match.index) {
        regex.lastIndex += 1
      }
    }

    rendered += escapeHtml(textItem.str.slice(lastIndex))
    return rendered
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

  useEffect(() => {
    if (inAppVideoUrl) {
      localStorage.setItem("studymate_inapp_video", inAppVideoUrl)
    } else {
      localStorage.removeItem("studymate_inapp_video")
    }
  }, [inAppVideoUrl])

  useEffect(() => {
    if (!isDraggingPlayerSplit) return

    const handlePointerMove = (event) => {
      const container = chatVideoContainerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const nextHeight = ((event.clientY - rect.top) / rect.height) * 100
      const clampedHeight = Math.max(25, Math.min(80, nextHeight))
      setChatPanelHeight(clampedHeight)
    }

    const stopDragging = () => setIsDraggingPlayerSplit(false)

    window.addEventListener("mousemove", handlePointerMove)
    window.addEventListener("mouseup", stopDragging)

    return () => {
      window.removeEventListener("mousemove", handlePointerMove)
      window.removeEventListener("mouseup", stopDragging)
    }
  }, [isDraggingPlayerSplit])

  // Restore PDF from localStorage on mount
  useEffect(() => {
    try {
      const savedPdf = localStorage.getItem("pdf_data")
      const savedName = localStorage.getItem("pdf_name")
      const savedPage = localStorage.getItem("pdf_page")

      if (savedPdf && savedName) {
        fetch(savedPdf)
          .then((res) => res.blob())
          .then((blob) => {
            const restored = new File([blob], savedName, { type: "application/pdf" })
            setFile(restored)
            if (savedPage) setPageNumber(parseInt(savedPage, 10))
            uploadPDF(restored)  // ✅ re-ingest into RAG backend on refresh
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

 useEffect(() => {
  if (!searchText) return

  const el = document.querySelector("mark")
  if (el) {
    setTimeout(() => {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
    }, 100)
  }
}, [currentMatch, pageNumber, searchText])
    // PDF handlers
  const onDocumentLoadSuccess = async (pdf) => {
    setNumPages(pdf.numPages)

    const index = {}

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const textContent = await page.getTextContent()

      index[p] = textContent.items.map((item) => item.str)
    }

    setPdfTextIndex(index)
  }

  const nextPage = () => setPageNumber((p) => Math.min(p + 1, numPages))
  const prevPage = () => setPageNumber((p) => Math.max(p - 1, 1))

  const uploadPDF = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8001/ingest", {
      method: "POST",
      body: formData,
    });

    if(res.ok){
      setRagAvailable(true)
    }
    if (!res.ok) {
      throw new Error("Upload failed");
    }

    const data = await res.json();
    console.log("Ingest result:", data);
  } catch (err) {
    console.error("Upload error:", err);
  }
};

  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

  
    uploadPDF(selectedFile)
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

  const closePdf = async () => {
    try {
      const pdfName = file.name

      if (pdfName) {
        await fetch(`http://localhost:8001/clear?source=${encodeURIComponent(pdfName)}`, {
          method: "POST",
        });
      }

      // Clear state AFTER API call
      setFile(null);
      setNumPages(null);
      setPageNumber(1);

      localStorage.removeItem("pdf_data");
      localStorage.removeItem("pdf_name");
      localStorage.removeItem("pdf_page");

    } catch (error) {
      console.error("Error clearing document:", error);
    }
  };

 useEffect(() => {
  if (!searchText || !pdfTextIndex) {
    setMatchPositions([])
    return
  }

  const results = []
  let counter = 0
  const lowerSearch = searchText.toLowerCase()

  Object.entries(pdfTextIndex).forEach(([page, texts]) => {
    texts.forEach((text, i) => {
      const lowerText = text.toLowerCase()
      let startIndex = 0

      while (true) {
        const found = lowerText.indexOf(lowerSearch, startIndex)
        if (found === -1) break

        results.push({
          page: Number(page),
          index: i,
          globalIndex: counter++,
        })

        startIndex = found + lowerSearch.length
      }
    })
  })

  setMatchPositions(results)
  setCurrentMatch(0)
}, [searchText, pdfTextIndex])

useEffect(() => {
  if (!matchPositions.length) return

  const match = matchPositions[currentMatch]
  if (match && match.page !== pageNumber) {
    setPageNumber(match.page)
  }
}, [currentMatch, matchPositions])
 

  //Intial assistant message
  useEffect(()=>{
    setMessages([
      {
        id:crypto.randomUUID(),
        role:"assistant",
        content:"Hi,what do you need help with today?",
        status:"done",
        createdAt:Date.now(),
      }
    ])
  },[])

  //Auto scroll to latest message

  useEffect(()=>{
    chatBottomRef.current?.scrollIntoView({behavior:"smooth"})
  },[messages])


  useEffect(() => {
      const saved = localStorage.getItem("studymate_chat")
      if (saved) {
        try{
          setMessages(JSON.parse(saved))
        }catch{
          console.warn("failed to parse saved chat")
        }
        
      }
      hasLoadedChat.current = true
    }, [])


    useEffect(() => {
      if(!hasLoadedChat.current) return;
      localStorage.setItem("studymate_chat", JSON.stringify(messages))
    }, [messages])

    

    const resetChat = () => {
      setMessages([])
      localStorage.removeItem("studymate_chat")
    }

  const fetchYoutubeRecommendations = async () => {
    if (!ytQuery.trim()) return
    setYtLoading(true)
    setYtResults(null)
    setYtError(null)
    try {
      const res = await fetch(`http://localhost:8001/youtube?query=${encodeURIComponent(ytQuery)}`)
      if (!res.ok) throw new Error("Request failed")
      const data = await res.json()
      setYtResults(data)
    } catch (err) {
      setYtError("Failed to fetch recommendations. Please try again.")
    } finally {
      setYtLoading(false)
    }
  }

  const toggleOpen = (e) => {
      e.stopPropagation()  // prevent the backdrop from catching this click
      const rect = iconRef.current?.getBoundingClientRect()
      if (rect) {
        setPosition({
          top: rect.top,
          left: rect.left + rect.width / 2,
        })
      }
      setOpen((prev) => !prev)
    }

  

  const RetrieveContext = async (query) => {
        console.log("🔍 RetrieveContext called with query:", query)
        
        if (!file) {
          console.log("❌ No file available, skipping RAG")
          return ""
        }

        const source = file.name
        console.log("📄 Source file:", source)

        const params = new URLSearchParams({ source, query, top_k: 5 })

        if (mode === "single") {
          params.append("page", singlePage)
          console.log("📃 Single page mode, page:", singlePage)
        } else if (mode === "range") {
          params.append("start_page", range.start)
          params.append("end_page", range.end)
          console.log("📃 Range mode, start:", range.start, "end:", range.end)
        }

        const url = `http://localhost:8001/retrieve?${params.toString()}`
        console.log("🌐 Fetching URL:", url)

        try {
          const res = await fetch(url)
          console.log("📡 Response status:", res.status, res.ok)

          if (!res.ok) {
            console.log("❌ Response not ok")
            return ""
          }

          const data = await res.json()
          console.log("📦 Raw response data:", data)

          if (data.status === "FAILED" || !data.context) {
            console.log("❌ No context returned or status FAILED:", data)
            return ""
          }

          console.log("✅ Context retrieved, length:", data.context.length)
          console.log("📝 Context preview:", data.context.slice(0, 200))
          const chunks = data.context.split("\n\n")
          const unique = [...new Set(chunks.map(c => c.trim()))].filter(Boolean)
          console.log("🧹 After dedup — chunks:", unique.length)
          return unique.join("\n\n")

        } catch (err) {
          console.error("💥 RetrieveContext fetch error:", err)
          return ""
        }
  }


  // Mock streaming method
  const streamAssistantReply = async ({ messages, prompt, signal, onChunk }) => {
      const MAX_MESSAGES = 10

      const contextMessages = [
        ...messages.slice(-MAX_MESSAGES).map(({ role, content }) => ({
          role,
          content,
        })),
      ]

      let context = ""
      if (ragavailable) {
        console.log("🤖 RAG is available, retrieving context...")
        context = await RetrieveContext(prompt)
        const MAX_CONTEXT = 500  // tweak this number as needed
        context = context.slice(0, MAX_CONTEXT)
        console.log("✂️ Trimmed context length:", context.length)
        console.log("✂️ Trimmed context:", context)
        console.log("📬 Final context sent to LLM (length):", context.length)
        console.log("📬 Context content:", context || "EMPTY — nothing retrieved")
      } else {
        console.log("⚠️ ragavailable is false — RAG skipped entirely")
      }

      console.log("📤 Sending to LLM — context length:", context.length)
      console.log("📤 Context being sent:", context.slice(0, 300) || "EMPTY")
      console.log("📤 Messages being sent:", contextMessages)

      const response = await fetch("http://localhost:8001/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: contextMessages,
          context,
        }),
        signal,
      })

      console.log("📡 LLM response status:", response.status, response.ok)

      if (!response.ok) {
        const errText = await response.text()
        console.error("❌ LLM request failed:", errText)
        throw new Error(errText || `Request failed with status ${response.status}`)
      }

      if (!response.body) throw new Error("No stream returned")

      console.log("✅ Stream started, receiving tokens...")

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let totalChunks = 0

      while (true) {
        const { value, done } = await reader.read()
        if (done) {
          console.log("🏁 Stream complete — total chunks received:", totalChunks)
          break
        }
        const chunk = decoder.decode(value, { stream: true })
        totalChunks++
        if (totalChunks <= 3) {
          console.log(`🔤 Chunk #${totalChunks}:`, chunk) // only log first 3 to avoid spam
        }
        onChunk(chunk)
      }

      const finalChunk = decoder.decode()
      if (finalChunk) onChunk(finalChunk)
  }


  const sendMessage = async () => {
      const text = chatInput.trim()
      if (!text || isSending) return

      const userMsg = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        status: "done",
        createdAt: Date.now(),
      }

      const assistantId = crypto.randomUUID()
      const assistantMsg = {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "streaming",
        createdAt: Date.now(),
      }

      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setChatInput("")
      setIsSending(true)

      const controller = new AbortController()
      streamAbortRef.current = controller

      try {
        streamBufferRef.current = ""

        const flushBufferedChunk = () => {
          const delta = streamBufferRef.current
          streamBufferRef.current = ""
          streamFrameRef.current = null
          if (!delta) return

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + delta } : m
            )
          )
        }
          const updatedMessages = [
                  ...messages,
                  userMsg
                ]

        await streamAssistantReply({
          messages:updatedMessages,
          prompt: text,
          signal: controller.signal,
          onChunk: (delta) => {
            streamBufferRef.current += delta
            if (streamFrameRef.current === null) {
              streamFrameRef.current = requestAnimationFrame(flushBufferedChunk)
            }
          },
        })

        if (streamFrameRef.current !== null) {
          cancelAnimationFrame(streamFrameRef.current)
          streamFrameRef.current = null
        }
        if (streamBufferRef.current) {
          const remaining = streamBufferRef.current
          streamBufferRef.current = ""
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + remaining } : m
            )
          )
        }

        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, status: "done" } : m))
        )
      } catch (err) {
        if (streamFrameRef.current !== null) {
          cancelAnimationFrame(streamFrameRef.current)
          streamFrameRef.current = null
        }
        streamBufferRef.current = ""

        if (err?.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: "Something went wrong.", status: "done" }
                : m
            )
          )
        }
      } finally {
        setIsSending(false)
        streamAbortRef.current = null
      }
    }

  const applyPanelSizes = (leftSize) => {
    if (Number.isNaN(leftSize)) return

    const left = Math.max(PANEL_LEFT_MIN, Math.min(PANEL_LEFT_MAX, leftSize))
    const right = 100 - left
    setPanelLayout([left, right])
    setPanelDefaults([left, right])
    setLayoutVersion((v) => v + 1)
    panelGroupRef.current?.setLayout?.([left, right])
  }

  const formatChatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })

  const renderHighlightedText = (text, keyPrefix) => {
    const parts = text.split(
      /(\b(?:Machine Learning|Artificial Intelligence|Training Data|Model|Prediction|Key Concepts|Important|Note)\b)/gi
    )

    return parts.map((part, idx) => {
      if (
        /^(Machine Learning|Artificial Intelligence|Training Data|Model|Prediction|Key Concepts|Important|Note)$/i.test(
          part
        )
      ) {
        return (
          <mark
            key={`${keyPrefix}-mark-${idx}`}
            className="bg-amber-200/80 dark:bg-amber-300/30 text-slate-900 dark:text-amber-100 px-1 rounded"
          >
            {part}
          </mark>
        )
      }
      return <span key={`${keyPrefix}-txt-${idx}`}>{part}</span>
    })
  }

  const renderInlineFormattedText = (text, keyPrefix) => {
    const pieces = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean)

    return pieces.map((piece, idx) => {
      if (piece.startsWith("**") && piece.endsWith("**")) {
        return (
          <strong key={`${keyPrefix}-strong-${idx}`} className="font-semibold">
            {piece.slice(2, -2)}
          </strong>
        )
      }

      if (piece.startsWith("`") && piece.endsWith("`")) {
        return (
          <code
            key={`${keyPrefix}-code-${idx}`}
            className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700/70 text-[0.92em]"
          >
            {piece.slice(1, -1)}
          </code>
        )
      }

      return renderHighlightedText(piece, `${keyPrefix}-plain-${idx}`)
    })
  }

  const renderAssistantContent = (content) => {
    const normalized = (content || "").replace(/\r\n/g, "\n")
    const lines = normalized.split("\n")
    const nodes = []
    let paragraphBuffer = []
    let orderedListBuffer = []
    let unorderedListBuffer = []
    let keyIndex = 0

    const flushParagraph = () => {
      if (!paragraphBuffer.length) return
      const text = paragraphBuffer.join(" ").trim()
      paragraphBuffer = []
      if (!text) return
      nodes.push(
        <p key={`p-${keyIndex++}`} className="leading-relaxed">
          {renderInlineFormattedText(text, `p-${keyIndex}`)}
        </p>
      )
    }

    const flushOrderedList = () => {
      if (!orderedListBuffer.length) return
      const items = orderedListBuffer
      orderedListBuffer = []
      nodes.push(
        <ol key={`ol-${keyIndex++}`} className="list-decimal ml-5 space-y-1.5">
          {items.map((item, itemIndex) => (
            <li key={`li-${keyIndex}-${itemIndex}`} className="pl-1">
              {renderInlineFormattedText(item, `li-${keyIndex}-${itemIndex}`)}
            </li>
          ))}
        </ol>
      )
    }

    const flushUnorderedList = () => {
      if (!unorderedListBuffer.length) return
      const items = unorderedListBuffer
      unorderedListBuffer = []
      nodes.push(
        <ul key={`ul-${keyIndex++}`} className="list-disc ml-5 space-y-1.5">
          {items.map((item, itemIndex) => (
            <li key={`uli-${keyIndex}-${itemIndex}`} className="pl-1">
              {renderInlineFormattedText(item, `uli-${keyIndex}-${itemIndex}`)}
            </li>
          ))}
        </ul>
      )
    }

    lines.forEach((rawLine) => {
      const line = rawLine.trim()

      if (!line) {
        if (paragraphBuffer.length) flushParagraph()
        flushOrderedList()
        flushUnorderedList()
        return
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.*)$/)
      if (headingMatch) {
        flushParagraph()
        flushOrderedList()
        flushUnorderedList()
        const level = headingMatch[1].length
        const title = headingMatch[2]
        const headingClass =
          level === 1
            ? "text-base font-bold"
            : level === 2
              ? "text-[15px] font-semibold"
              : "text-sm font-semibold"

        nodes.push(
          <h3 key={`h-${keyIndex++}`} className={`${headingClass} text-indigo-700 dark:text-indigo-300`}>
            {renderInlineFormattedText(title, `h-${keyIndex}`)}
          </h3>
        )
        return
      }

      const orderedMatch = line.match(/^\d+\.\s+(.*)$/)
      if (orderedMatch) {
        flushParagraph()
        flushUnorderedList()
        orderedListBuffer.push(orderedMatch[1])
        return
      }

      const unorderedMatch = line.match(/^[-*]\s+(.*)$/)
      if (unorderedMatch) {
        flushParagraph()
        flushOrderedList()
        unorderedListBuffer.push(unorderedMatch[1])
        return
      }

      flushOrderedList()
      flushUnorderedList()
      paragraphBuffer.push(line)
    })

    flushParagraph()
    flushOrderedList()
    flushUnorderedList()

    return nodes
  }

  const copyMessage = async (messageId, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(messageId)
      setTimeout(() => setCopiedMessageId((id) => (id === messageId ? null : id)), 1400)
    } catch (_err) {
      setCopiedMessageId(null)
    }
  }

  const renderAvatar = (role) => {
    const isUser = role === "user"

    return (
      <div
        className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center border ${
          isUser
            ? "bg-indigo-500 border-indigo-400 text-white"
            : "bg-white dark:bg-slate-800 border-indigo-200 dark:border-white/15 text-indigo-600 dark:text-indigo-300"
        }`}
      >
        {isUser ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M12 2a8 8 0 0 0-8 8v3a2 2 0 0 0 2 2h1v3a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-3h1a2 2 0 0 0 2-2v-3a8 8 0 0 0-8-8Zm-3 9a1 1 0 1 1 1-1 1 1 0 0 1-1 1Zm6 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1Z" />
          </svg>
        )}
      </div>
    )
  }

  pageMatchCounter.current = 0

  return (
    <div className="h-screen w-screen p-4 bg-gradient-to-br from-indigo-100 via-sky-100 to-purple-100 
    dark:from-[#0f172a] dark:via-[#020617] dark:to-[#020617] animate-gradient-x transition-colors duration-500">

      <div className="h-full w-full rounded-3xl border border-indigo-100/60 dark:border-white/10 
      bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.15)] 
      overflow-hidden transition-all duration-300 flex flex-col">

        <div className="shrink-0 border-b border-indigo-100/70 dark:border-white/10 bg-white/50 dark:bg-white/[0.03] px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                Panel Size
              </span>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-indigo-600 dark:text-indigo-300/90">PDF</span>
                <input
                  type="number"
                  min={PANEL_LEFT_MIN}
                  max={PANEL_LEFT_MAX}
                  value={Math.round(panelLayout[0])}
                  onChange={(e) => applyPanelSizes(Number(e.target.value))}
                  className="w-16 rounded-md border border-indigo-200/80 dark:border-white/15 bg-white/80 dark:bg-white/10 px-2 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">%</span>
              </div>

              <input
                type="range"
                min={PANEL_LEFT_MIN}
                max={PANEL_LEFT_MAX}
                value={panelLayout[0]}
                onChange={(e) => applyPanelSizes(Number(e.target.value))}
                className="w-40 accent-indigo-500"
              />

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-indigo-600 dark:text-indigo-300/90">Chat</span>
                <input
                  type="number"
                  min={100 - PANEL_LEFT_MAX}
                  max={100 - PANEL_LEFT_MIN}
                  value={Math.round(panelLayout[1])}
                  onChange={(e) => applyPanelSizes(100 - Number(e.target.value))}
                  className="w-16 rounded-md border border-indigo-200/80 dark:border-white/15 bg-white/80 dark:bg-white/10 px-2 py-1 text-xs text-slate-800 dark:text-slate-100 outline-none"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">%</span>
              </div>
            </div> */}

          </div>
        </div>

        <ResizablePanelGroup
          key={layoutVersion}
          ref={panelGroupRef}
          direction="horizontal"
          className="flex-1 min-h-0 w-full"
          onLayout={(sizes) => setPanelLayout(sizes)}
        >

          {/* 📚 LEFT PANEL – PDF VIEWER */}
          <ResizablePanel
            defaultSize={panelDefaults[0]}
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
                  <div className="shrink-0 flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Search in PDF..."
                      value={searchText}
                      onChange={(e) => {
                        setSearchText(e.target.value)
                        setCurrentMatch(0)
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" || !matchPositions.length) return
                        e.preventDefault()

                        setCurrentMatch((m) => {
                          if (e.shiftKey) {
                            return m <= 0 ? matchPositions.length - 1 : m - 1
                          }
                          return m >= matchPositions.length - 1 ? 0 : m + 1
                        })
                      }}
                      className="flex-1 px-2 py-1 rounded-lg bg-white/60 dark:bg-white/10 text-xs"
                    />

                    <button
                      onClick={() =>
                        setCurrentMatch((m) =>
                          Math.max(0, m - 1)
                        )
                      }
                      className="px-2 py-1 text-xs rounded bg-indigo-100 dark:bg-white/10"
                    >
                      ↑
                    </button>

                    <button
                      onClick={() =>
                        setCurrentMatch((m) =>
                          Math.min(matchPositions.length - 1, m + 1)
                        )
                      }
                      className="px-2 py-1 text-xs rounded bg-indigo-100 dark:bg-white/10"
                    >
                      ↓
                    </button>

                    <span className="text-[10px] px-1">
                      {matchPositions.length
                        ? `${currentMatch + 1}/${matchPositions.length}`
                        : "0"}
                    </span>
                  </div>

                  {/* PDF CONTAINER — flex-1 + min-h-0 keeps it from overflowing */}
                  <div
                    ref={pdfContainerRef}
                    className="flex-1 min-h-0 overflow-auto w-full flex justify-center
                    bg-white/40 dark:bg-white/5 rounded-xl p-2"
                  >
                    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                      <Page
                        key={`${pageNumber}-${searchText}-${currentMatch}`}
                        pageNumber={pageNumber}
                        width={pdfWidth}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        customTextRenderer={highlightText}
                      />
                    </Document>
                  </div>

                  {/* CONTROLS — always visible, pinned at bottom */}
                  <div className="shrink-0 w-full px-1 py-1 text-xs text-indigo-700 dark:text-indigo-300">
                  <div className="grid grid-cols-3 items-center w-full">

                    {/* LEFT — Prev */}
                    <div className="flex justify-start">
                      <button
                        onClick={prevPage}
                        disabled={pageNumber <= 1}
                        className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-white/10 
                        disabled:opacity-30 hover:bg-indigo-200 dark:hover:bg-white/20 
                        transition-colors font-medium"
                      >
                        ‹ Prev
                      </button>
                    </div>

                    {/* CENTER — Page number */}
                    <div className="flex justify-center">
                      <span className="text-[11px] tabular-nums">
                        {pageNumber} / {numPages || "--"}
                      </span>
                    </div>

                    {/* RIGHT — Zoom + Next */}
                    <div className="flex justify-end items-center gap-2">

                      {/* Zoom */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => setScale((s) => Math.max(0.5, s - 0.1))}
                          className="px-2 py-1 rounded bg-indigo-100 dark:bg-white/10"
                        >
                          −
                        </button>

                        <span className="text-[10px] w-10 text-center">
                          {(scale * 100).toFixed(0)}%
                        </span>

                        <button
                          onClick={() => setScale((s) => Math.min(3, s + 0.1))}
                          className="px-2 py-1 rounded bg-indigo-100 dark:bg-white/10"
                        >
                          +
                        </button>
                      </div>

                      {/* Next */}
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

                  </div>
                </div>
                </>
              )}
            </div>
          </ResizablePanel>

          {/* HANDLE */}
          <ResizableHandle withHandle />

          {/* 🤖 RIGHT PANEL */}
          <ResizablePanel defaultSize={panelDefaults[1]} minSize={40} className="flex h-full min-h-0 flex-col overflow-hidden">
            <div ref={chatVideoContainerRef} className="flex h-full min-h-0 flex-col overflow-hidden">

              {/* TOP: header + chat + composer */}
            <div
              className="flex min-h-0 flex-col"
              style={{ flexBasis: inAppVideoUrl ? `${chatPanelHeight}%` : "100%" }}
            >

            {/* HEADER */}
            <div className="border-b border-indigo-100/70 dark:border-white/10 px-6 py-4 flex items-center justify-between">

                {/* LEFT */}
                <h1 className="font-semibold text-indigo-700 dark:text-indigo-300">
                  🤖 Ai Chat
                </h1>

                {/* RIGHT */}
                <div className="flex items-center gap-3">
                  
                  {/* YouTube Icon Button */}
                  <div className="relative">
                    <button
                      onClick={() => { setYtPanelOpen((p) => !p); setYtResults(null); setYtError(null); setYtQuery(""); }}
                      title="YouTube Recommendations"
                      className="cursor-pointer text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                    >
                      <FaYoutube size={22} />
                    </button>

                    {/* YouTube Floating Panel */}
                    {ytPanelOpen && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-[9990]"
                          onClick={() => setYtPanelOpen(false)}
                        />
                        <div
                          ref={ytPanelRef}
                          className="fixed z-[9991] right-4 top-16 w-[480px] max-h-[80vh] flex flex-col
                            rounded-2xl shadow-2xl border border-red-100 dark:border-white/10
                            bg-white dark:bg-zinc-900 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Panel Header */}
                          <div className="shrink-0 px-4 pt-3.5 pb-2.5 border-b border-red-50 dark:border-white/10
                            bg-red-50/60 dark:bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FaYoutube className="text-red-500" size={15} />
                              <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                                YouTube Recommendations
                              </span>
                            </div>
                            <button
                              onClick={() => setYtPanelOpen(false)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                                transition-colors text-xs leading-none px-1"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Search Input */}
                          <div className="shrink-0 px-4 py-3 border-b border-red-50 dark:border-white/10">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={ytQuery}
                                onChange={(e) => setYtQuery(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") fetchYoutubeRecommendations() }}
                                placeholder="e.g. Machine Learning in Tamil..."
                                className="flex-1 text-sm px-3 py-2 rounded-xl
                                  border border-red-100 dark:border-white/15
                                  bg-white dark:bg-white/10
                                  text-slate-800 dark:text-slate-100
                                  placeholder:text-slate-400 dark:placeholder:text-slate-500
                                  outline-none focus:ring-2 focus:ring-red-400/40
                                  transition-all"
                                autoFocus
                              />
                              <button
                                onClick={fetchYoutubeRecommendations}
                                disabled={ytLoading || !ytQuery.trim()}
                                className="shrink-0 px-4 py-2 rounded-xl text-xs font-semibold
                                  bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-50
                                  text-white transition-colors duration-200
                                  shadow-sm shadow-red-200 dark:shadow-red-900/50"
                              >
                                {ytLoading ? "..." : "Search"}
                              </button>
                            </div>
                          </div>

                          {/* Results Area */}
                          <div className="flex-1 overflow-y-auto min-h-0">
                            {/* Loading Animation */}
                            {ytLoading && (
                              <div className="flex flex-col items-center justify-center gap-3 py-12 px-4">
                                <div className="flex gap-1.5">
                                  {[0, 1, 2, 3].map((i) => (
                                    <div
                                      key={i}
                                      className="w-2 h-2 rounded-full bg-red-400"
                                      style={{
                                        animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 animate-pulse">
                                  AI is finding the best videos for you...
                                </p>
                                <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }`}</style>
                              </div>
                            )}

                            {/* Error */}
                            {ytError && !ytLoading && (
                              <div className="mx-4 my-4 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400">
                                {ytError}
                              </div>
                            )}

                            {/* Empty prompt */}
                            {!ytLoading && !ytError && !ytResults && (
                              <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
                                <FaYoutube className="text-red-300 dark:text-red-700" size={36} />
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                  Enter a topic to get AI-curated video recommendations
                                </p>
                              </div>
                            )}

                            {/* Video Results */}
                            {!ytLoading && ytResults && ytResults.videos && (
                              <div className="px-3 py-3 space-y-3">
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                                  {ytResults.count} results for "{ytResults.query_used?.replace(/"/g, '')}"
                                </p>
                                {ytResults.videos.map((video, idx) => (
                                  <div
                                    key={idx}
                                    className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-white/10
                                      bg-white/80 dark:bg-white/5 hover:bg-red-50/50 dark:hover:bg-white/8
                                      transition-colors group"
                                  >
                                    {/* Thumbnail */}
                                    <div className="shrink-0 relative w-24 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/10">
                                      <img
                                        src={video.thumbnail}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.style.display = 'none' }}
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <FaYoutube className="text-white" size={20} />
                                      </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
                                      <div>
                                        <p
                                          className="text-xs font-semibold text-slate-800 dark:text-slate-100 line-clamp-2 leading-snug"
                                          dangerouslySetInnerHTML={{ __html: video.title }}
                                        />
                                        <p className="text-[10px] text-red-500 dark:text-red-400 mt-0.5 font-medium truncate">
                                          {video.channel}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                          {video.description}
                                        </p>
                                      </div>

                                      {/* Action Buttons */}
                                      <div className="flex gap-1.5 mt-1">
                                        <button
                                          onClick={() => {
                                            const embedUrl = video.video_url.replace(
                                              /watch\?v=([\w-]+)/,
                                              "embed/$1"
                                            )
                                            setInAppVideoUrl(embedUrl)
                                            setYtPanelOpen(false)
                                          }}
                                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
                                            bg-red-500 hover:bg-red-600 text-white transition-colors"
                                        >
                                          <FaYoutube size={10} />
                                          Watch
                                        </button>
                                        <a
                                          href={video.video_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
                                            bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20
                                            text-slate-700 dark:text-slate-200 transition-colors"
                                        >
                                          <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 fill-current" aria-hidden="true">
                                            <path d="M14 3h7v7h-2V6.41l-9.29 9.3-1.42-1.42L17.59 5H14V3ZM5 5h6V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6h-2v6H5V5Z"/>
                                          </svg>
                                          Open Tab
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Rotate Icon */}
                  <RotateCw onClick={resetChat} className="cursor-pointer text-indigo-600 dark:text-indigo-200 hover:rotate-180 transition-transform duration-300" />

                  {/* Theme Switch */}
                  <div className="relative flex items-center justify-center w-14 h-10">
                    <div
                      className={`pointer-events-none absolute top-0 h-20 w-20 rounded-full blur-2xl transition-all duration-500 ${
                        theme === "light"
                          ? "bg-amber-300/40 opacity-100"
                          : "bg-amber-300/0 opacity-0"
                      }`}
                    />

                    <Lightbulb
                      duration={750}
                      toggled={theme === "dark"}
                      toggle={toggleTheme}
                      className="text-3xl text-indigo-600 dark:text-indigo-200 p-1.5 rounded-full hover:bg-indigo-100/70 dark:hover:bg-white/10 transition-colors cursor-pointer"
                    />
                  </div>

                </div>
              </div>

            {/* ── CHAT BODY ── */}
            <div className="flex-1 min-h-0 flex flex-col bg-gradient-to-b from-white/30 to-indigo-50/30 dark:from-white/[0.03] dark:to-white/[0.02]">
              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`w-full flex items-end gap-2 ${
                      m.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {m.role === "assistant" && renderAvatar("assistant")}

                    <div className={`max-w-[82%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm border ${
                          m.role === "user"
                            ? "bg-indigo-500 text-white border-indigo-400 rounded-br-md"
                            : "bg-white/90 dark:bg-white/10 text-slate-800 dark:text-slate-100 border-indigo-100 dark:border-white/10 rounded-bl-md"
                        }`}
                      >
                        {m.role === "assistant" ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                                Answer
                              </span>
                              <button
                                type="button"
                                onClick={() => copyMessage(m.id, m.content)}
                                className="text-[10px] px-2 py-0.5 rounded-md border border-indigo-200 dark:border-white/20 hover:bg-indigo-50 dark:hover:bg-white/10 transition-colors"
                                disabled={!m.content}
                              >
                                {copiedMessageId === m.id ? "Copied ✅" : "Copy 📋"}
                              </button>
                            </div>

                            <div className="space-y-2 break-words">
                              {m.content
                                ? renderAssistantContent(m.content)
                                : m.status === "streaming"
                                  ? "Thinking... 🤖"
                                  : ""}
                            </div>
                          </div>
                        ) : (
                          m.content || ""
                        )}
                      </div>
                      <span className="mt-1 px-1 text-[10px] text-slate-500 dark:text-slate-400">
                        {formatChatTime(m.createdAt)}
                      </span>
                    </div>

                    {m.role === "user" && renderAvatar("user")}
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t border-indigo-100/70 dark:border-white/10 p-3 bg-white/50 dark:bg-white/[0.03] backdrop-blur-sm">
                {ragavailable && (
                  <div className="relative group w-fit mb-3">

                    {/* Trigger Icon */}
                    <div
                      ref={iconRef}
                      onClick={(e) => toggleOpen(e)}
                      className={`cursor-pointer transition-all duration-300 group-hover:scale-110 p-1.5 rounded-lg
                        ${open
                          ? "text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-500/20"
                          : "text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-white/10"
                        }`}
                    >
                      <Bolt size={16} />
                    </div>

                    {/* Hover Tooltip — only when closed */}
                    {!open && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2
                        opacity-0 group-hover:opacity-100 transition-all duration-200
                        bg-slate-800 dark:bg-slate-700 text-white text-[11px]
                        px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none
                        shadow-lg">
                        Adjust RAG Context
                        {/* Arrow */}
                        <span className="absolute right-full top-1/2 -translate-y-1/2
                          border-4 border-transparent border-r-slate-800 dark:border-r-slate-700" />
                      </div>
                    )}

                    {/* Drop-up Panel */}
                    {open && createPortal(
                        <>
                          {/* Backdrop */}
                          <div
                            className="fixed inset-0 z-[9998]"
                            onClick={() => setOpen(false)}
                          />
                          <div
                            style={{
                              position: "fixed",
                              top: position.top,
                              left: position.left,
                              transform: "translate(-50%, calc(-100% - 12px))",
                              zIndex: 9999,
                            }}
                            className="w-60 rounded-2xl shadow-2xl border
                              bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl
                              border-indigo-100 dark:border-white/10
                              overflow-hidden"
                          >
                          {/* Panel Header */}
                          <div className="px-4 pt-3.5 pb-2.5 border-b border-indigo-50 dark:border-white/10
                            bg-indigo-50/60 dark:bg-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Bolt size={13} className="text-indigo-500 dark:text-indigo-400" />
                              <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                RAG Context
                              </span>
                            </div>
                            <button
                              onClick={() => setOpen(false)}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200
                                transition-colors text-xs leading-none px-1"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="p-4 space-y-4">

                            {/* Mode Toggle */}
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-400
                                dark:text-slate-500 mb-2 font-medium">
                                Mode
                              </p>
                              <div className="flex gap-1.5 p-1 rounded-xl bg-indigo-50 dark:bg-white/5
                                border border-indigo-100 dark:border-white/10">
                                {["single", "range"].map((m) => (
                                  <button
                                    key={m}
                                    onClick={() => setMode(m)}
                                    className={`flex-1 text-xs px-3 py-1.5 rounded-lg font-medium
                                      transition-all duration-200 capitalize
                                      ${mode === m
                                        ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900"
                                        : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                                      }`}
                                  >
                                    {m}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Page Input(s) */}
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-400
                                dark:text-slate-500 mb-2 font-medium">
                                {mode === "single" ? "Page" : "Page Range"}
                              </p>

                              {mode === "single" ? (
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={1}
                                    max={numPages || 999}
                                    value={singlePage}
                                    onChange={(e) => setSinglePage(Number(e.target.value))}
                                    className="w-full text-sm px-3 py-2 rounded-xl
                                      border border-indigo-100 dark:border-white/15
                                      bg-white dark:bg-white/10
                                      text-slate-800 dark:text-slate-100
                                      outline-none focus:ring-2 focus:ring-indigo-400/40
                                      transition-all"
                                  />
                                  {numPages && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2
                                      text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none">
                                      / {numPages}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={numPages || 999}
                                    value={range.start}
                                    onChange={(e) => setRange({ ...range, start: Number(e.target.value) })}
                                    placeholder="Start"
                                    className="w-1/2 text-sm px-3 py-2 rounded-xl
                                      border border-indigo-100 dark:border-white/15
                                      bg-white dark:bg-white/10
                                      text-slate-800 dark:text-slate-100
                                      outline-none focus:ring-2 focus:ring-indigo-400/40
                                      placeholder:text-slate-300 dark:placeholder:text-slate-600
                                      transition-all"
                                  />
                                  <span className="text-slate-300 dark:text-slate-600 text-sm font-light">→</span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={numPages || 999}
                                    value={range.end}
                                    onChange={(e) => setRange({ ...range, end: Number(e.target.value) })}
                                    placeholder="End"
                                    className="w-1/2 text-sm px-3 py-2 rounded-xl
                                      border border-indigo-100 dark:border-white/15
                                      bg-white dark:bg-white/10
                                      text-slate-800 dark:text-slate-100
                                      outline-none focus:ring-2 focus:ring-indigo-400/40
                                      placeholder:text-slate-300 dark:placeholder:text-slate-600
                                      transition-all"
                                  />
                                </div>
                              )}
                            </div>

                            {/* Apply Button */}
                            <button
                              onClick={() => {
                                // wire up your apply logic here
                                setOpen(false)
                              }}
                              className="w-full py-2 rounded-xl text-xs font-semibold
                                bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700
                                text-white transition-colors duration-200
                                shadow-sm shadow-indigo-200 dark:shadow-indigo-900/50"
                            >
                              Apply Context
                            </button>

                          </div>

                          {/* Arrow pointing down toward trigger */}
                          <div className="absolute left-1/2 -translate-x-1/2 -bottom-[7px]
                            w-3.5 h-3.5 rotate-45
                            bg-white dark:bg-zinc-900
                            border-r border-b border-indigo-100 dark:border-white/10" />
                        </div>
                      </>,
                      document.body
                    )}
                  </div>
                )}
                <div className="flex items-end gap-2 rounded-2xl border border-indigo-100/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/40 p-2">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    className="flex-1 resize-none rounded-xl px-3 py-2 text-sm bg-white/70 dark:bg-white/10 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-300 outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  
                  <button
                    onClick={sendMessage}
                    disabled={isSending || !chatInput.trim()}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                      <path d="M3.4 20.4a1 1 0 0 1-1.33-1.26l2.2-6.35a1 1 0 0 0 0-.66l-2.2-6.27A1 1 0 0 1 3.4 4.6l17.8 6.4a1 1 0 0 1 0 1.88Z" />
                    </svg>
                    {isSending ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </div>

            </div>

              {/* Conditionally render handle + video panel BELOW chat */}
              {inAppVideoUrl && (
                <>
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    onMouseDown={() => setIsDraggingPlayerSplit(true)}
                    className="group relative flex h-1.5 w-full shrink-0 cursor-row-resize items-center justify-center bg-indigo-200/80 transition-colors hover:bg-indigo-300/90 dark:bg-white/15 dark:hover:bg-white/25"
                  >
                    <div className="z-10 flex h-5 w-8 items-center justify-center rounded-md border border-indigo-300/80 bg-white/90 shadow-sm dark:border-white/20 dark:bg-slate-800/90">
                      <GripVertical className="h-4 w-4 text-indigo-500 dark:text-indigo-200" />
                    </div>
                  </div>
                  <div className="flex min-h-[240px] flex-1 flex-col">
                    {/* Video panel header */}
                    <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-red-100/70 dark:border-white/10 bg-red-50/50 dark:bg-white/5">
                      <div className="flex items-center gap-2">
                        <FaYoutube className="text-red-500" size={14} />
                        <span className="text-xs font-semibold text-red-700 dark:text-red-300">In-App Player</span>
                      </div>
                      <button onClick={() => setInAppVideoUrl(null)} title="Close player"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-xs leading-none px-1">
                        ✕
                      </button>
                    </div>
                    {/* iFrame */}
                    <div className="flex-1 min-h-0 bg-black">
                      <iframe
                        key={inAppVideoUrl}
                        src={inAppVideoUrl}
                        title="YouTube In-App Player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                </>
              )}

            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}

export default Home
