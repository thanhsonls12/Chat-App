import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { UserPlus } from 'lucide-react'
import type { User } from '@/types/user'
import { useFriendStore } from '@/stores/useFriendStore'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import SearchForm from '../AddFriendModal/SearchForm'
import SendFriendRequestForm from '../AddFriendModal/SendFriendRequestForm'
import { SidebarGroupAction } from '../ui/sidebar'

export interface IFormValues {
  username: string
  message: string
}

export default function AddFriendModal() {
  const [open, setOpen] = useState(false)
  const [isFound, setIsFound] = useState<boolean | null>(null)
  const [searchUser, setSearchUser] = useState<User>()
  const [searchedUsername, setSearchedUsername] = useState<string>('')
  const { addFriend, loading, searchByUsername } = useFriendStore()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<IFormValues>({
    defaultValues: {
      username: '',
      message: '',
    },
  })

  const usernameValue = useWatch({ control, name: 'username' }) ?? ''

  const handleSearch = handleSubmit(async (data) => {
    const username = data.username.trim()
    if (!username) return
    setIsFound(null)
    setSearchUser(undefined)
    setSearchedUsername(username)
    try {
      const foundUser = await searchByUsername(username)
      if (foundUser) {
        setIsFound(true)
        setSearchUser(foundUser)
      } else {
        setIsFound(false)
      }
    } catch (error) {
      console.error(error)
    }
  })

  const handleSend = handleSubmit(async (data) => {
    if (!searchUser) return
    try {
      const message = await addFriend(searchUser._id, data.message.trim())
      toast.success(message)
      setOpen(false)
    } catch (error) {
      console.error(error)
    }
  })

  const handleCancel = () => {
    reset()
    setSearchedUsername('')
    setIsFound(null)
    setSearchUser(undefined)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) handleCancel()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <SidebarGroupAction title="Kết bạn" className="cursor-pointer">
          <UserPlus className="size-4" />
          <span className="sr-only">Kết Bạn</span>
        </SidebarGroupAction>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] border-none">
        <DialogHeader>
          <DialogTitle>Kết Bạn</DialogTitle>
        </DialogHeader>
        {!isFound && (
          <>
            <SearchForm
              register={register}
              errors={errors}
              usernameValue={usernameValue}
              loading={loading}
              isFound={isFound}
              searchedUsername={searchedUsername}
              onSubmit={handleSearch}
              onCancel={handleCancel}
            />
          </>
        )}
        {isFound && (
          <>
            <SendFriendRequestForm
              register={register}
              errors={errors}
              loading={loading}
              searchedUsername={searchedUsername}
              onSubmit={handleSend}
              onBack={() => {
                setIsFound(null)
                setSearchUser(undefined)
              }}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
