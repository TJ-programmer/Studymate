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

const ResizableHandle = ({ withHandle, className, ...props }) => {
  return (
    <PanelResizeHandle
      className={cn(
        // Base: shared transition + group so children can read this element's data attrs
        "group relative flex items-center justify-center transition-colors",
        // Vertical handle (horizontal drag bar — separates top/bottom panels)
        "data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full",
        "data-[panel-group-direction=vertical]:flex-row",
        "data-[panel-group-direction=vertical]:bg-indigo-200/80 dark:data-[panel-group-direction=vertical]:bg-white/15",
        "data-[panel-group-direction=vertical]:hover:bg-indigo-300/90 dark:data-[panel-group-direction=vertical]:hover:bg-white/25",
        // Horizontal handle (vertical drag bar — separates left/right panels)
        "data-[panel-group-direction=horizontal]:w-1.5 data-[panel-group-direction=horizontal]:h-full",
        "data-[panel-group-direction=horizontal]:flex-col",
        "data-[panel-group-direction=horizontal]:bg-indigo-200/80 dark:data-[panel-group-direction=horizontal]:bg-white/15",
        "data-[panel-group-direction=horizontal]:hover:bg-indigo-300/90 dark:data-[panel-group-direction=horizontal]:hover:bg-white/25",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div
          className={cn(
            "z-10 flex items-center justify-center rounded-md border border-indigo-300/80 dark:border-white/20 bg-white/90 dark:bg-slate-800/90 shadow-sm",
            // Use group-data so this child div reads the parent handle's data-panel-group-direction
            // Vertical group → wide flat pill (horizontal drag bar)
            "group-data-[panel-group-direction=vertical]:h-5 group-data-[panel-group-direction=vertical]:w-8",
            // Horizontal group → tall narrow pill (vertical drag bar)
            "group-data-[panel-group-direction=horizontal]:h-8 group-data-[panel-group-direction=horizontal]:w-5"
          )}
        >
          <GripVertical className="h-4 w-4 text-indigo-500 dark:text-indigo-200" />
        </div>
      )}
    </PanelResizeHandle>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
