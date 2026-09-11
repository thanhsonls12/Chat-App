import { useFriendStore } from '@/stores/useFriendStore'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import ReceivedRequest from './ReceivedRequest'
import SentRequests from './SentRequests'
import { useI18n } from '@/i18n'

interface FriendRequestDiaglogProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export default function FriendRequestsDialog({
  open,
  setOpen,
}: FriendRequestDiaglogProps) {
  const [tab, setTab] = useState('received')
  const { t } = useI18n()
  const { getAllFriendRequests } = useFriendStore()
  useEffect(() => {
    if (!open) return

    const loadRequest = async () => {
      try {
        await getAllFriendRequests()
      } catch (error) {
        console.error(error)
      }
    }
    void loadRequest()
  }, [getAllFriendRequests, open])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('friendRequests')}</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="min-h-0 w-full flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="received"
              className="focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none data-[state=active]:font-bold"
            >
              {t('received')}
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="focus-visible:ring-1 focus-visible:ring-ring/40 focus-visible:outline-none data-[state=active]:font-bold"
            >
              {t('sentTab')}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="received" className="w-full flex-none">
            <ReceivedRequest />
          </TabsContent>
          <TabsContent value="sent" className="w-full flex-none">
            <SentRequests />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
