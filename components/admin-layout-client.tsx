/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Bell,
  Settings,
  LogOut,
  Home,
  ChevronRight,
  User,
  UserCog,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { BusinessUnitItem } from '@/types/business-unit-types';
import { useCurrentBusinessUnit, usePermissions } from '@/context/business-unit-context';
import { useSession } from 'next-auth/react';

interface AdminLayoutProps {
  children: React.ReactNode;
  businessUnitId: string;
  businessUnits: BusinessUnitItem[];
}

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast?: boolean;
}

// Mock notifications - in real app, this would come from your API
const mockNotifications = [
  {
    id: '1',
    title: 'Property approval pending',
    description: 'Title #TR-2024-001 requires approval',
    time: '2 minutes ago',
    type: 'approval'
  },
  {
    id: '2',
    title: 'Property released',
    description: 'Property in Makati successfully released',
    time: '5 minutes ago',
    type: 'release'
  },
  {
    id: '3',
    title: 'Turnover completed',
    description: 'Property TR-001234 turnover completed',
    time: '10 minutes ago',
    type: 'turnover'
  }
];

const AdminLayoutClient: React.FC<AdminLayoutProps> = ({
  children,
  businessUnitId,
  businessUnits,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const { businessUnit } = useCurrentBusinessUnit();
  const { isAdmin, userRole } = usePermissions();

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Skip business unit ID in breadcrumbs, start from meaningful segments
    for (let i = 1; i < pathSegments.length; i++) {
      const segment = pathSegments[i];
      
      // Skip the business unit ID segment
      if (segment === businessUnitId) continue;
      
      const href = '/' + pathSegments.slice(0, i + 1).join('/');
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({ 
        label, 
        href,
        isLast: i === pathSegments.length - 1
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const currentBusinessUnit = businessUnits.find(unit => unit.id === businessUnitId);

  const getUserInitials = () => {
    const firstName = session?.user?.firstName || '';
    const lastName = session?.user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    const firstName = session?.user?.firstName || '';
    const lastName = session?.user?.lastName || '';
    return `${firstName} ${lastName}`.trim() || session?.user?.email || 'User';
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/sign-in' });
  };

  const unreadNotifications = mockNotifications.length;

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-full items-center justify-between px-6">
            {/* Left Side - Business Unit Info and Breadcrumbs */}
            <div className="flex items-center space-x-6">
              {/* Business Unit Info */}
              {currentBusinessUnit && (
                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold tracking-tight">
                    {currentBusinessUnit.name}
                  </h1>
                  <div className="flex items-center space-x-2">
                    {isAdmin && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {userRole?.replace('_', ' ') || 'User'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <>
                  <Separator orientation="vertical" className="h-6" />
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href={`/${businessUnitId}/dashboard`}>
                          <Home className="h-4 w-4" />
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      
                      {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={crumb.href}>
                          <BreadcrumbSeparator>
                            <ChevronRight className="h-4 w-4" />
                          </BreadcrumbSeparator>
                          <BreadcrumbItem>
                            {crumb.isLast ? (
                              <BreadcrumbPage className="font-medium">
                                {crumb.label}
                              </BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink 
                                href={crumb.href}
                                className="transition-colors hover:text-foreground"
                              >
                                {crumb.label}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </React.Fragment>
                      ))}
                    </BreadcrumbList>
                  </Breadcrumb>
                </>
              )}
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadNotifications > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                      >
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="font-semibold">
                    Notifications
                    {unreadNotifications > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {unreadNotifications}
                      </Badge>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <ScrollArea className="max-h-64">
                    {mockNotifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="flex flex-col items-start p-4 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.time}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push(`/${businessUnitId}/notifications`)}
                    className="text-center justify-center font-medium"
                  >
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/${businessUnitId}/settings`)}
              >
                <Settings className="h-4 w-4" />
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {getUserDisplayName()}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => router.push(`/${businessUnitId}/profile`)}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => router.push(`/${businessUnitId}/settings`)}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  
                  {isAdmin && (
                    <DropdownMenuItem 
                      onClick={() => router.push(`/${businessUnitId}/admin`)}
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-muted/10">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayoutClient;