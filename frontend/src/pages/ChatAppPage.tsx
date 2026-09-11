import ChatWindowLayout from '@/components/chat/ChatWindowLayout'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import IncomingCallDialog from '@/components/call/IncomingCallDialog'
import VideoCallOverlay from '@/components/call/VideoCallOverlay'

export default function ChatAppPage() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex h-screen w-full p-2">
          <ChatWindowLayout />
        </div>
      </SidebarProvider>
      <IncomingCallDialog />
      <VideoCallOverlay />
    </TooltipProvider>
  )
}
