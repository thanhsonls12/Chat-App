import * as React from 'react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Moon, Sun } from 'lucide-react'

import CreateNewChat from '../chat/CreateNewChat'
import NewGroupChatModal from '../chat/NewGroupChatModal'
import GroupChatList from '../chat/GroupChatList'
import AddFriendModal from '../chat/AddFriendModal'
import DirectMessageList from '../chat/DirectMessageList'
import { useThemeStore } from '@/stores/useThemeStore'
import { Switch } from '../ui/switch'
import { useAuthStore } from '@/stores/useAuthStore'
import { NavUser } from './nav-user'
import LanguageSwitcher from '../LanguageSwitcher'
import { useI18n } from '@/i18n'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isDark, toggleTheme } = useThemeStore()
  const { user } = useAuthStore()
  const { t } = useI18n()
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="bg-gradient-primary"
            >
              <div>
                <div className="flex w-full items-center px-2 justify-between">
                  <h1 className="text-xl font-bold text-white">Chat-App</h1>
                  <div className="flex items-center gap-2 justify-between">
                    <LanguageSwitcher />
                    <Sun className="size-4 text-white/80" />
                    <Switch
                      checked={isDark}
                      onCheckedChange={toggleTheme}
                      aria-label={t('toggleTheme')}
                      className="data-[state=checked]:bg-background/80"
                    />
                    <Moon className="size-4 text-white/80" />
                  </div>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="beautiful-scrollbar">
        <SidebarGroup>
          <SidebarGroupContent>
            <CreateNewChat />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">{t('chatGroups')}</SidebarGroupLabel>

          <SidebarGroupAction title={t('createGroup')} className="cursor-pointer">
            <NewGroupChatModal />
          </SidebarGroupAction>

          <SidebarGroupContent>
            <GroupChatList />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="uppercase">{t('friends')}</SidebarGroupLabel>

          <AddFriendModal />

          <SidebarGroupContent>
            <DirectMessageList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>{user && <NavUser user={user} />}</SidebarFooter>
    </Sidebar>
  )
}
