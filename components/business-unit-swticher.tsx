"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Building2,
  Plus,
  Check,
  Monitor,
  Settings,
  ChevronDown,
  Store,
  Code,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { BusinessUnitItem } from "@/types/business-unit-types"
import { usePermissions } from "@/context/business-unit-context"

interface BusinessUnitSwitcherProps {
  items: BusinessUnitItem[]
  className?: string
}

// Get appropriate icon based on business unit name/description
const getBusinessUnitIcon = (name?: string, description?: string) => {
  if (!name && !description) return Building2
  
  const searchText = `${name || ''} ${description || ''}`.toLowerCase()
  
  if (searchText.includes('admin') || searchText.includes('management')) {
    return Settings
  }
  if (searchText.includes('store') || searchText.includes('retail') || searchText.includes('shop')) {
    return Store
  }
  if (searchText.includes('dev') || searchText.includes('development') || searchText.includes('code')) {
    return Code
  }
  if (searchText.includes('system') || searchText.includes('main')) {
    return Monitor
  }
  
  return Building2
}

// Get business unit type label
const getBusinessUnitTypeLabel = (name?: string, description?: string) => {
  if (!name && !description) return 'Business Unit'
  
  const searchText = `${name || ''} ${description || ''}`.toLowerCase()
  
  if (searchText.includes('admin') || searchText.includes('management')) {
    return 'Administrative Unit'
  }
  if (searchText.includes('store') || searchText.includes('retail') || searchText.includes('shop')) {
    return 'Retail Unit'
  }
  if (searchText.includes('dev') || searchText.includes('development')) {
    return 'Development Unit'
  }
  if (searchText.includes('system') || searchText.includes('main')) {
    return 'System Unit'
  }
  
  return 'Business Unit'
}

export default function BusinessUnitSwitcher({ 
  className, 
  items = [] 
}: BusinessUnitSwitcherProps) {
  const { canManageBusinessUnit } = usePermissions()
  const params = useParams()
  const router = useRouter()

  const isSwitcherActive = items.length > 1
  const currentBusinessUnit = items.find((item) => item.id === params.businessUnitId)

  const onBusinessUnitSelect = (businessUnitId: string) => {
    router.push(`/${businessUnitId}`)
    router.refresh()
  }

  const handleAddBusinessUnit = () => {
    // Navigate to business unit creation page or open modal
    router.push('/business-units/create')
  }

  // Static display for single unit users
  if (!isSwitcherActive) {
    const IconComponent = getBusinessUnitIcon(
      currentBusinessUnit?.name, 
      currentBusinessUnit?.description || undefined
    )
    
    return (
      <div className={cn("flex items-center space-x-3 px-3 py-2 rounded-lg border bg-card", className)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {currentBusinessUnit?.name || "No Unit Assigned"}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {currentBusinessUnit?.description || 
             getBusinessUnitTypeLabel(currentBusinessUnit?.name, currentBusinessUnit?.description || undefined)}
          </p>
        </div>
      </div>
    )
  }

  // Interactive dropdown for multi-unit users
  const CurrentIcon = getBusinessUnitIcon(
    currentBusinessUnit?.name, 
    currentBusinessUnit?.description || undefined
  )

  // Group business units (you can customize this logic)
  const productionUnits = items.filter((item, index) => index < 3)
  const developmentUnits = items.filter((item, index) => index >= 3)

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between h-auto px-3 py-2"
          >
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <CurrentIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">
                  {currentBusinessUnit?.name || "Select Unit"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentBusinessUnit?.description || 
                   getBusinessUnitTypeLabel(currentBusinessUnit?.name, currentBusinessUnit?.description || undefined)}
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[280px] p-2" align="start">
          {/* Production Section */}
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
            Active Units
          </DropdownMenuLabel>

          {/* Current/Selected item */}
          {currentBusinessUnit && (
            <DropdownMenuItem
              onClick={() => onBusinessUnitSelect(currentBusinessUnit.id)}
              className="flex items-center space-x-3 p-2 mb-1 bg-accent/50 border border-accent rounded-md"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <CurrentIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentBusinessUnit.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentBusinessUnit.description || 
                   getBusinessUnitTypeLabel(currentBusinessUnit.name, currentBusinessUnit.description || undefined)}
                </p>
              </div>
              <Check className="h-4 w-4 text-primary" />
            </DropdownMenuItem>
          )}

          {/* Other business units */}
          {productionUnits
            .filter(item => item.id !== currentBusinessUnit?.id)
            .map((item) => {
              const IconComponent = getBusinessUnitIcon(item.name, item.description || undefined)
              return (
                <DropdownMenuItem
                  key={item.id}
                  onClick={() => onBusinessUnitSelect(item.id)}
                  className="flex items-center space-x-3 p-2 rounded-md"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.description || 
                       getBusinessUnitTypeLabel(item.name, item.description || undefined)}
                    </p>
                  </div>
                </DropdownMenuItem>
              )
            })}

          {/* Development Section (if there are more units) */}
          {developmentUnits.length > 0 && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                Other Units
              </DropdownMenuLabel>

              {developmentUnits.map((item) => {
                const IconComponent = getBusinessUnitIcon(item.name, item.description || undefined)
                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => onBusinessUnitSelect(item.id)}
                    className="flex items-center space-x-3 p-2 rounded-md"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description || 
                         getBusinessUnitTypeLabel(item.name, item.description || undefined)}
                      </p>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </>
          )}

          {/* Add Business Unit Option - Only show if user has permission */}
          {canManageBusinessUnit && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem
                onClick={handleAddBusinessUnit}
                className="flex items-center space-x-3 p-2 rounded-md text-muted-foreground hover:text-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                  <Plus className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Add Business Unit
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create new unit
                  </p>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}