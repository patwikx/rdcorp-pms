// components/properties/property-filters.tsx
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Calendar as CalendarIcon,
  X,
  SlidersHorizontal,
  Building,
  MapPin,
  User,
  FileCheck
} from 'lucide-react';
import { PropertyClassification, PropertyStatus } from '@prisma/client';
import type { PropertyFilters } from '@/types/property-types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PropertyFiltersProps {
  filters: PropertyFilters;
  onFiltersChange: (filters: PropertyFilters) => void;
  filterOptions: {
    locations: string[];
    registeredOwners: string[];
    createdByUsers: Array<{ id: string; name: string }>;
  };
}

export function PropertyFiltersComponent({ 
  filters, 
  onFiltersChange, 
  filterOptions 
}: PropertyFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const updateFilter = (key: keyof PropertyFilters, value: string | Date | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
    setShowAdvanced(false);
  };

  const clearFilter = (key: keyof PropertyFilters) => {
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'PENDING': 'Pending',
      'RELEASED': 'Released',
      'RETURNED': 'Returned',
      'UNDER_REVIEW': 'Under Review',
      'DISPUTED': 'Disputed'
    };
    return labels[status] || status;
  };

  const getClassificationLabel = (classification: string) => {
    const labels: Record<string, string> = {
      'RESIDENTIAL': 'Residential',
      'COMMERCIAL': 'Commercial',
      'INDUSTRIAL': 'Industrial',
      'AGRICULTURAL': 'Agricultural',
      'INSTITUTIONAL': 'Institutional',
      'MIXED_USE': 'Mixed Use',
      'VACANT_LOT': 'Vacant Lot',
      'OTHER': 'Other'
    };
    return labels[classification] || classification;
  };

  return (
    <div className="space-y-4">
      {/* Main Search and Primary Filters Row */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, location, or owner..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Status Filter */}
        <Select
          value={filters.status || ''}
          onValueChange={(value) => updateFilter('status', value as PropertyStatus)}
        >
          <SelectTrigger className="w-[140px]">
            <FileCheck className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RELEASED">Released</SelectItem>
            <SelectItem value="RETURNED">Returned</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="DISPUTED">Disputed</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {/* Quick Classification Filter */}
        <Select
          value={filters.classification || ''}
          onValueChange={(value) => updateFilter('classification', value as PropertyClassification)}
        >
          <SelectTrigger className="w-[160px]">
            <Building className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="RESIDENTIAL">Residential</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
            <SelectItem value="AGRICULTURAL">Agricultural</SelectItem>
            <SelectItem value="INSTITUTIONAL">Institutional</SelectItem>
            <SelectItem value="MIXED_USE">Mixed Use</SelectItem>
            <SelectItem value="VACANT_LOT">Vacant Lot</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
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
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {getStatusLabel(filters.status)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('status')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.classification && (
            <Badge variant="secondary" className="gap-1">
              Type: {getClassificationLabel(filters.classification)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('classification')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.location && (
            <Badge variant="secondary" className="gap-1">
              Location: {filters.location}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('location')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.registeredOwner && (
            <Badge variant="secondary" className="gap-1">
              Owner: {filters.registeredOwner}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('registeredOwner')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.createdBy && (
            <Badge variant="secondary" className="gap-1">
              Created by: {filterOptions.createdByUsers.find(u => u.id === filters.createdBy)?.name || filters.createdBy}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('createdBy')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {format(filters.dateFrom, "MMM dd, yyyy")}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('dateFrom')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {format(filters.dateTo, "MMM dd, yyyy")}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter('dateTo')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Location Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </Label>
              <Select
                value={filters.location || 'all'}
                onValueChange={(value) => updateFilter('location', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {filterOptions.locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Registered Owner Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <User className="h-3 w-3" />
                Owner
              </Label>
              <Select
                value={filters.registeredOwner || 'all'}
                onValueChange={(value) => updateFilter('registeredOwner', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  {filterOptions.registeredOwners.map((owner) => (
                    <SelectItem key={owner} value={owner}>
                      {owner}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Created By Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Created By</Label>
              <Select
                value={filters.createdBy || 'all'}
                onValueChange={(value) => updateFilter('createdBy', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {filterOptions.createdByUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Date Range
              </Label>
              <div className="flex gap-1">
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateFrom && "text-muted-foreground"
                      )}
                    >
                      {filters.dateFrom ? (
                        format(filters.dateFrom, "MMM dd")
                      ) : (
                        "From"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => {
                        updateFilter('dateFrom', date);
                        setDateFromOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !filters.dateTo && "text-muted-foreground"
                      )}
                    >
                      {filters.dateTo ? (
                        format(filters.dateTo, "MMM dd")
                      ) : (
                        "To"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => {
                        updateFilter('dateTo', date);
                        setDateToOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}