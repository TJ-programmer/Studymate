import { GripVertical } from "lucide-react"
import { forwardRef } from "react"
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels"
import { cn } from "@/lib/utils"

const ResizablePanelGroup = forwardRef(
  ({ className, direction, ...props }, ref) => (
    <PanelGroup
      ref={ref}
      direction={direction}
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className
      )}
      {...props}
    />
  )
)
ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = Panel

const ResizableHandle = ({ withHandle, className, ...props }) => (
  <PanelResizeHandle
    className={cn(
      "relative flex w-1.5 items-center justify-center bg-indigo-200/80 dark:bg-white/15 hover:bg-indigo-300/90 dark:hover:bg-white/25 transition-colors",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-8 w-5 items-center justify-center rounded-md border border-indigo-300/80 dark:border-white/20 bg-white/90 dark:bg-slate-800/90 shadow-sm">
        <GripVertical className="h-4 w-4 text-indigo-500 dark:text-indigo-200" />
      </div>
    )}
  </PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
