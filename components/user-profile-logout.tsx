'use client'

import React from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  LogOut, 
  Bell, 
  MoreHorizontal,
  User,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBusinessUnit } from '@/context/business-unit-context'


export function UserProfileLogout() {
  const { data: session } = useSession()
  const { businessUnitId } = useBusinessUnit()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/sign-in' })
  }

  const handleNotifications = () => {
    router.push(`/${businessUnitId}/notifications`)
  }

  const handleProfile = () => {
    router.push(`/${businessUnitId}/profile`)
  }

  const getUserInitials = () => {
    const firstName = session?.user?.firstName || ''
    const lastName = session?.user?.lastName || ''
    
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    
    if (session?.user?.name) {
      const names = session.user.name.split(' ')
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase()
      }
      return session.user.name.charAt(0).toUpperCase()
    }
    
    return 'U'
  }

  const getUserDisplayName = () => {
    const firstName = session?.user?.firstName || ''
    const lastName = session?.user?.lastName || ''
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim()
    }
    
    return session?.user?.name || session?.user?.email || 'User'
  }

  const getUserEmail = () => {
    return session?.user?.email || ''
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start h-auto p-3 border border-border hover:bg-accent/50"
        >
          <div className="flex items-center space-x-3 w-full min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={session?.user?.image || undefined} />
              <AvatarFallback className="text-sm font-medium">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">
                {getUserDisplayName()}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {getUserEmail()}
              </p>
            </div>

            <MoreHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent 
        className="w-56" 
        align="start"
        side="top"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {getUserDisplayName()}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {getUserEmail()}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleProfile}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleNotifications}>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default UserProfileLogout