import { useRef, useEffect } from "react"
import { gsap } from "gsap"
import { Draggable } from "gsap/draggable"

gsap.registerPlugin(Draggable)

export default function PullLamp({ toggleTheme }) {
  const hitRef = useRef(null)
  const lineRef = useRef(null)
  const proxyRef = useRef(null)

  useEffect(() => {
    const proxy = document.createElement("div")
    proxyRef.current = proxy

    const line = lineRef.current

    const ENDX = 100
    const ENDY = 300

    let startX = 0
    let startY = 0

    gsap.set(proxy, { x: ENDX, y: ENDY })

    Draggable.create(proxy, {
      trigger: hitRef.current,
      type: "x,y",

      onPress(e) {
        startX = e.x
        startY = e.y
      },

      onDrag() {
        gsap.set(line, {
          attr: {
            x2: this.x,
            y2: this.y,
          },
        })
      },

      onRelease(e) {
        const dx = Math.abs(e.x - startX)
        const dy = Math.abs(e.y - startY)
        const travelled = Math.sqrt(dx * dx + dy * dy)

        gsap.to(line, {
          attr: { x2: ENDX, y2: ENDY },
          duration: 0.2,
          ease: "power2.out",
          onComplete: () => {
            if (travelled > 50) {
              toggleTheme() // 🔥 YOUR FUNCTION
            }
          },
        })
      },
    })
  }, [toggleTheme])

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2">
      <svg
        viewBox="0 0 200 400"
        className="h-[50vh] overflow-visible"
      >
        {/* Cord */}
        <line
          x1="100"
          y1="0"
          x2="100"
          y2="300"
          stroke="currentColor"
          strokeWidth="4"
          ref={lineRef}
        />

        {/* Hit area (invisible but draggable) */}
        <circle
          ref={hitRef}
          cx="100"
          cy="300"
          r="40"
          fill="transparent"
          className="cursor-grab active:cursor-grabbing"
        />

        {/* Bulb */}
        <circle
          cx="100"
          cy="340"
          r="30"
          className="fill-yellow-300 dark:fill-yellow-200 transition-colors duration-300"
        />
      </svg>
    </div>
  )
}