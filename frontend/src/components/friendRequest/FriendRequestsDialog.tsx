import { useFriendStore } from '@/stores/useFriendStore'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import ReceivedRequest from './ReceivedRequest'
import SentRequests from './SentRequests'

interface FriendRequestDiaglogProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
}

export default function FriendRequestsDialog({
  open,
  setOpen,
}: FriendRequestDiaglogProps) {
  const [tab, setTab] = useState('received')
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lời mời kết bạn</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full ">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Đã nhận</TabsTrigger>
            <TabsTrigger value="sent">Đã gửi</TabsTrigger>
          </TabsList>
          <TabsContent value="received">
            <ReceivedRequest />
          </TabsContent>
          <TabsContent value="sent">
            <SentRequests />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
