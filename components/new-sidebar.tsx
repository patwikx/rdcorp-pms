"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Building2,
  Users,
  Home,
  Send,
  RotateCcw,
  ArrowLeftRight,
  CheckCircle,
  BarChart3,
  Settings,
  Shield,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  Activity,
  Plus,
  Search,
  FolderOpen,
  Download,
  UserPlus,
} from "lucide-react"

import type { BusinessUnitItem } from "@/types/business-unit-types"
import type { UserAssignment } from "@/next-auth"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import BusinessUnitSwitcher from "./business-unit-swticher"
import UserProfileLogout from "./user-profile-logout"
import { usePermissions } from "@/context/business-unit-context"

// Navigation structure for Property Management System
export interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  children?: NavItem[]
  permission?: string
  roles?: string[]
  badge?: string
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Properties",
    icon: Home,
    permission: "properties:read",
    children: [
      { 
        title: "All Properties", 
        href: "/properties", 
        icon: Home,
        permission: "properties:read",
      },
      { 
        title: "Add Property", 
        href: "/properties/create", 
        icon: Plus,
        permission: "properties:create",
      },
      { 
        title: "Property Search", 
        href: "/properties/search", 
        icon: Search,
        permission: "properties:read",
      },
    ],
  },
  {
    title: "Property Workflow",
    icon: ArrowLeftRight,
    permission: "properties:read",
    children: [
      { 
        title: "Approvals", 
        href: "/approvals", 
        icon: CheckCircle,
        permission: "properties:approve",
        badge: "pending"
      },
      { 
        title: "Releases", 
        href: "/releases", 
        icon: Send,
        permission: "properties:release",
      },
      { 
        title: "Turnovers", 
        href: "/turnovers", 
        icon: ArrowLeftRight,
        permission: "properties:turnover",
      },
      { 
        title: "Returns", 
        href: "/returns", 
        icon: RotateCcw,
        permission: "properties:return",
      },
    ],
  },
  {
    title: "Reports & Analytics",
    icon: BarChart3,
    permission: "reports:view_all",
    children: [
      { 
        title: "Property Reports", 
        href: "/reports/properties", 
        icon: BarChart3,
        permission: "reports:view_all",
      },
      { 
        title: "Workflow Reports", 
        href: "/reports/workflow", 
        icon: Activity,
        permission: "reports:view_all",
      },
      { 
        title: "User Activity", 
        href: "/reports/users", 
        icon: Users,
        permission: "reports:view_all",
      },
      { 
        title: "Export Data", 
        href: "/reports/export", 
        icon: Download,
        permission: "reports:export",
      },
    ],
  },
]

const managementNavigation: NavItem[] = [
  {
    title: "User Management",
    icon: Users,
    permission: "users:read",
    children: [
      { 
        title: "All Users", 
        href: "/users", 
        icon: Users,
        permission: "users:read",
      },
      { 
        title: "Add User", 
        href: "/users/create", 
        icon: UserPlus,
        permission: "users:create",
      },
      { 
        title: "User Assignments", 
        href: "/users/assignments", 
        icon: ClipboardList,
        permission: "users:manage_roles",
      },
    ],
  },
  {
    title: "Business Units",
    icon: Building2,
    permission: "business_units:read",
    children: [
      { 
        title: "All Units", 
        href: "/business-units", 
        icon: FolderOpen,
        permission: "business_units:read",
      },
      { 
        title: "Add Unit", 
        href: "/business-units/create", 
        icon: Plus,
        permission: "business_units:create",
      },
      { 
        title: "Unit Members", 
        href: "/business-units/members", 
        icon: Users,
        permission: "business_units:manage_members",
      },
    ],
  },
  {
    title: "Roles & Permissions",
    icon: Shield,
    roles: ["System Administrator"],
    children: [
      { 
        title: "All Roles", 
        href: "/roles", 
        icon: Shield,
        roles: ["System Administrator"],
      },
      { 
        title: "Create Role", 
        href: "/roles/create", 
        icon: Plus,
        roles: ["System Administrator"],
      },
      { 
        title: "Role Assignments", 
        href: "/roles/assignments", 
        icon: UserCheck,
        roles: ["System Administrator"],
      },
    ],
  },
]

const systemNavigation: NavItem[] = [
  {
    title: "System",
    icon: Settings,
    roles: ["System Administrator"],
    children: [
      { 
        title: "Audit Logs", 
        href: "/audit", 
        icon: Activity,
        permission: "audit_logs:view",
      },
      { 
        title: "System Settings", 
        href: "/settings", 
        icon: Settings,
        permission: "system:manage",
      },
    ],
  },
]

// Props interface
interface SidebarProps {
  businessUnitId: string
  businessUnits: BusinessUnitItem[]
  currentUser: {
    id: string
    firstName: string | null
    lastName: string | null
    assignments: UserAssignment[]
  }
}

interface SidebarLinkProps {
  item: NavItem
  businessUnitId: string
  depth?: number
  hasPermission: (permission: string) => boolean
  hasRole: (roleName: string) => boolean
  hasAnyRole: (roleNames: string[]) => boolean
  isAdmin: boolean
}

// Sidebar Link Component
function SidebarLink({ item, businessUnitId, depth = 0, hasPermission, hasRole, hasAnyRole, isAdmin }: SidebarLinkProps) {
  const pathname = usePathname()
  
  // Check permissions at the top level to avoid conditional hook calls
  const itemHasPermission = useMemo(() => {
    // System Administrator has access to everything
    if (isAdmin) return true
    
    // If no permission or role requirement, allow access
    if (!item.permission && !item.roles) return true
    
    // Check specific permission
    if (item.permission && hasPermission(item.permission)) return true
    
    // Check specific roles
    if (item.roles && hasAnyRole(item.roles)) return true
    
    return false
  }, [item.permission, item.roles, hasPermission, hasAnyRole, isAdmin])

  // Always call useState - no conditional calls
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((child) => {
        const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
        return pathname.startsWith(childHref)
      })
    }
    return false
  })

  // Early return after all hooks are called
  if (!itemHasPermission) return null

  const href = item.href ? `/${businessUnitId}${item.href}` : ""
  const isActive = pathname === href

  if (item.children) {
    // Filter children based on permissions
    const visibleChildren = item.children.filter(child => {
      if (isAdmin) return true
      if (!child.permission && !child.roles) return true
      if (child.permission && hasPermission(child.permission)) return true
      if (child.roles && hasAnyRole(child.roles)) return true
      return false
    })
    
    if (visibleChildren.length === 0) return null

    const isAnyChildActive = visibleChildren.some((child) => {
      const childHref = child.href ? `/${businessUnitId}${child.href}` : ""
      return pathname.startsWith(childHref)
    })

    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start h-9 px-3",
              depth > 0 && "ml-4",
              isAnyChildActive && "bg-accent text-accent-foreground font-medium"
            )}
          >
            <item.icon size={16} className="mr-2 shrink-0" />
            <span className="truncate">{item.title}</span>
            <div className="ml-auto">
              {open ? (
                <ChevronDown size={14} className="shrink-0" />
              ) : (
                <ChevronRight size={14} className="shrink-0" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1">
          {visibleChildren.map((child) => (
            <SidebarLink
              key={child.title}
              item={child}
              businessUnitId={businessUnitId}
              depth={depth + 1}
              hasPermission={hasPermission}
              hasRole={hasRole}
              hasAnyRole={hasAnyRole}
              isAdmin={isAdmin}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <Button
      asChild
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start h-9 px-3",
        depth > 0 && "ml-4",
        isActive && "bg-accent text-accent-foreground font-medium"
      )}
    >
      <Link href={href}>
        <item.icon size={16} className="mr-2 shrink-0" />
        <span className="truncate">{item.title}</span>
        {item.badge && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {item.badge}
          </Badge>
        )}
      </Link>
    </Button>
  )
}

// Navigation Section Component
function NavigationSection({ 
  title, 
  items, 
  businessUnitId,
  hasPermission,
  hasRole,
  hasAnyRole,
  isAdmin
}: { 
  title: string
  items: NavItem[]
  businessUnitId: string
  hasPermission: (permission: string) => boolean
  hasRole: (roleName: string) => boolean
  hasAnyRole: (roleNames: string[]) => boolean
  isAdmin: boolean
}) {
  // Filter items based on permissions
  const visibleItems = useMemo(() => {
    return items.filter(item => {
      if (isAdmin) return true
      if (!item.permission && !item.roles) return true
      if (item.permission && hasPermission(item.permission)) return true
      if (item.roles && hasAnyRole(item.roles)) return true
      return false
    })
  }, [items, hasPermission, hasAnyRole, isAdmin])

  if (visibleItems.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="px-3 py-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="space-y-1">
        {visibleItems.map((item) => (
          <SidebarLink
            key={item.title}
            item={item}
            businessUnitId={businessUnitId}
            hasPermission={hasPermission}
            hasRole={hasRole}
            hasAnyRole={hasAnyRole}
            isAdmin={isAdmin}
          />
        ))}
      </div>
    </div>
  )
}

// Main Sidebar Component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function Sidebar({ businessUnitId, businessUnits, currentUser }: SidebarProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isAdmin, userRole, hasPermission, hasRole, hasAnyRole } = usePermissions()

  // Determine if user should see management sections
  const canViewManagement = isAdmin || hasAnyRole([
    'Property Manager', 
    'Property Supervisor', 
    'Finance Manager', 
    'Legal Officer'
  ]) || hasPermission('users:read') || hasPermission('business_units:read')

  return (
    <div className="flex flex-col h-full w-64 bg-background border-r">
      {/* Header - Business Unit Switcher */}
      <div className="p-4">
        <BusinessUnitSwitcher items={businessUnits} />
      </div>
      
      <Separator />

      {/* Main Content */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-4">
          {/* Core Navigation */}
          <NavigationSection
            title="Overview"
            items={navigation}
            businessUnitId={businessUnitId}
            hasPermission={hasPermission}
            hasRole={hasRole}
            hasAnyRole={hasAnyRole}
            isAdmin={isAdmin}
          />

          <Separator className="my-4" />

          {/* Management Navigation - For users with management permissions */}
          {canViewManagement && (
            <>
              <NavigationSection
                title="Management"
                items={managementNavigation}
                businessUnitId={businessUnitId}
                hasPermission={hasPermission}
                hasRole={hasRole}
                hasAnyRole={hasAnyRole}
                isAdmin={isAdmin}
              />
              <Separator className="my-4" />
            </>
          )}

          {/* System Navigation - Only for System Administrators */}
          {(isAdmin || hasRole('System Administrator')) && (
            <NavigationSection
              title="System"
              items={systemNavigation}
              businessUnitId={businessUnitId}
              hasPermission={hasPermission}
              hasRole={hasRole}
              hasAnyRole={hasAnyRole}
              isAdmin={isAdmin}
            />
          )}
        </div>
      </ScrollArea>

      {/* Footer - User Profile */}
      <div className="p-4 border-t">
        <UserProfileLogout />
      </div>
    </div>
  )
}