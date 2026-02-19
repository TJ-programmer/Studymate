import { useEffect, useState } from "react"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

function Home() {
  const [theme, setTheme] = useState("light")

  // Load theme from localStorage or system
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

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  return (
    <div className="h-screen w-screen p-4 bg-gradient-to-br from-indigo-100 via-sky-100 to-purple-100 
    dark:from-[#0f172a] dark:via-[#020617] dark:to-[#020617] animate-gradient-x transition-colors duration-500">
      
      <div className="h-full w-full rounded-3xl border border-indigo-100/60 dark:border-white/10 
      bg-white/70 dark:bg-white/5 backdrop-blur-xl shadow-[0_10px_40px_rgba(99,102,241,0.15)] 
      overflow-hidden transition-all duration-300">
        
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full"
          autoSaveId="study-layout"
        >
          
          {/* 📚 LEFT PANEL */}
          <ResizablePanel
            defaultSize={25}
            minSize={18}
            className="group flex flex-col bg-gradient-to-b from-indigo-50/80 to-white/60 
            dark:from-white/5 dark:to-white/0 backdrop-blur-md 
            transition-all duration-300 hover:shadow-inner hover:shadow-indigo-200/40"
          >
            <div className="border-b border-indigo-100/70 dark:border-white/10 
            px-4 py-3 font-semibold text-indigo-700 dark:text-indigo-300 
            tracking-wide backdrop-blur-sm bg-white/40 dark:bg-white/5 
            sticky top-0 z-10">
              📚 Materials
            </div>

            <div className="flex-1 p-2" />
          </ResizablePanel>

          {/* HANDLE */}
          <ResizableHandle
            withHandle
            className="relative w-2 bg-transparent 
            before:absolute before:inset-y-0 before:left-1/2 before:-translate-x-1/2 
            before:w-[2px] before:rounded-full before:bg-indigo-300 dark:before:bg-indigo-500 
            hover:before:bg-indigo-500 dark:hover:before:bg-indigo-400 
            transition-all duration-300"
          />

          {/* 🤖 RIGHT PANEL */}
          <ResizablePanel
            defaultSize={75}
            minSize={40}
            className="group flex flex-col bg-gradient-to-b from-white/80 to-indigo-50/60 
            dark:from-white/5 dark:to-white/0 backdrop-blur-md 
            transition-all duration-300 hover:shadow-inner hover:shadow-indigo-200/40"
          >
            {/* HEADER */}
            <div className="border-b border-indigo-100/70 dark:border-white/10 
            px-6 py-4 flex items-center justify-between 
            bg-white/40 dark:bg-white/5 backdrop-blur-sm 
            sticky top-0 z-10">
              
              <h1 className="font-semibold text-indigo-700 dark:text-indigo-300 
              tracking-wide flex items-center gap-2">
                🤖 Ai Chat
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              </h1>

              {/* 💡 LAMP TOGGLE */}
              <div className="relative flex items-start justify-center w-16 h-12">
                
                {/* Glow */}
                <div
                  className={`absolute top-4 h-24 w-24 rounded-full blur-2xl transition-all duration-500 ${
                    theme === "dark"
                      ? "bg-yellow-300/20"
                      : "bg-indigo-300/20"
                  }`}
                />

                {/* Chain */}
                <button
                  onClick={toggleTheme}
                  className="flex flex-col items-center group focus:outline-none"
                >
                  <div className="w-[2px] h-6 bg-gray-400 dark:bg-gray-500 
                  transition-all duration-200 group-active:h-9" />

                  <div
                    className="w-3 h-3 rounded-full bg-gray-500 dark:bg-gray-400 
                    shadow-md transition-transform duration-200 
                    group-active:translate-y-1"
                  />
                </button>

                {/* Lamp */}
                <div
                  className={`absolute top-6 w-10 h-6 rounded-b-full 
                  border border-gray-300 dark:border-gray-600 
                  transition-all duration-500 ${
                    theme === "dark"
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

      {/* Animated gradient background */}
      <style jsx global>{`
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradientMove 12s ease infinite;
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}

export default Home
