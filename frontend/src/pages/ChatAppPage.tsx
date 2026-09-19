import ChatWindowLayout from '@/components/chat/ChatWindowLayout'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import IncomingCallDialog from '@/components/call/IncomingCallDialog'
import VoiceCallOverlay from '@/components/call/VoiceCallOverlay'

export default function ChatAppPage() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex h-dvh w-full p-2">
          <ChatWindowLayout />
        </div>
      </SidebarProvider>
      <IncomingCallDialog />
      <VoiceCallOverlay />
    </TooltipProvider>
  )
}
