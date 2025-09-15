// components/users/user-filters.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  User,
  Shield,
  Building
} from 'lucide-react';
import type { UserFilters } from '@/types/user-management-types';

interface UserFiltersProps {
  filters: UserFilters;
  onFiltersChange: (filters: UserFilters) => void;
  filterOptions: {
    roles: Array<{ id: string; name: string }>;
    businessUnits: Array<{ id: string; name: string }>;
  };
}

export function UserFiltersComponent({ 
  filters, 
  onFiltersChange, 
  filterOptions 
}: UserFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof UserFilters, value: string | boolean | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setShowAdvanced(false);
  };

  const clearFilter = (key: keyof UserFilters) => {
    updateFilter(key, undefined);
  };

  const getActiveFilterCount = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { search, ...otherFilters } = filters;
    return Object.values(otherFilters).filter(value => 
      value !== undefined && value !== '' && value !== null
    ).length;
  };

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Primary Filters Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or username..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Status Filter */}
        <Select
          value={filters.isActive !== undefined ? filters.isActive.toString() : 'all'}
          onValueChange={(value) => updateFilter('isActive', value === 'all' ? undefined : value === 'true')}
        >
          <SelectTrigger className="w-[140px]">
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Quick Role Filter */}
        <Select
          value={filters.roleId || 'all'}
          onValueChange={(value) => updateFilter('roleId', value === 'all' ? undefined : value)}
        >
          <SelectTrigger className="w-[160px]">
            <Shield className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {filterOptions.roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
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
          {filters.isActive !== undefined && (
            <Badge variant="secondary" className="gap-1">
              Status: {getStatusLabel(filters.isActive)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('isActive')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.roleId && (
            <Badge variant="secondary" className="gap-1">
              Role: {filterOptions.roles.find(r => r.id === filters.roleId)?.name || filters.roleId}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('roleId')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.businessUnitId && (
            <Badge variant="secondary" className="gap-1">
              Unit: {filterOptions.businessUnits.find(bu => bu.id === filters.businessUnitId)?.name || filters.businessUnitId}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('businessUnitId')}
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
            {/* Business Unit Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Building className="h-3 w-3" />
                Business Unit
              </Label>
              <Select
                value={filters.businessUnitId || 'all'}
                onValueChange={(value) => updateFilter('businessUnitId', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All business units" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All business units</SelectItem>
                  {filterOptions.businessUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}