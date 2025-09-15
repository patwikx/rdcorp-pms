// components/roles/role-filters.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X,
  SlidersHorizontal,
  Shield,
  Users
} from 'lucide-react';
import type { RoleFilters } from '@/types/user-management-types';

interface RoleFiltersProps {
  filters: RoleFilters;
  onFiltersChange: (filters: RoleFilters) => void;
}

export function RoleFiltersComponent({ 
  filters, 
  onFiltersChange
}: RoleFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof RoleFilters, value: string | boolean | undefined) => {
    let processedValue: string | boolean | undefined = value;
    
    // Only treat empty strings as undefined, preserve false boolean values
    if (typeof value === 'string' && value === '') {
      processedValue = undefined;
    }
    
    onFiltersChange({
      ...filters,
      [key]: processedValue,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setShowAdvanced(false);
  };

  const clearFilter = (key: keyof RoleFilters) => {
    updateFilter(key, undefined);
  };

  const getActiveFilterCount = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { search, ...otherFilters } = filters;
    return Object.values(otherFilters).filter(value => 
      value !== undefined && value !== null && value !== null
    ).length;
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  const getMembersLabel = (hasMembers: boolean) => {
    return hasMembers ? 'With Members' : 'Without Members';
  };

  // Helper function to convert boolean to string for Select component
  const getMembersSelectValue = () => {
    if (filters.hasMembers === undefined) return 'all';
    return filters.hasMembers ? 'true' : 'false';
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Primary Filters Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by role name or description..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Members Filter */}
        <Select
          value={getMembersSelectValue()}
          onValueChange={(value) => {
            if (value === 'all') {
              updateFilter('hasMembers', undefined);
            } else {
              updateFilter('hasMembers', value === 'true');
            }
          }}
        >
          <SelectTrigger className="w-[160px]">
            <Users className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Members" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="true">With Members</SelectItem>
            <SelectItem value="false">Without Members</SelectItem>
          </SelectContent>
        </Select>

        {/* More Filters Button */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="relative"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          More Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.hasMembers !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Members: {getMembersLabel(filters.hasMembers)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('hasMembers')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Additional filters can be added here in the future */}
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                <Shield className="h-3 w-3" />
                Additional filters coming soon...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}