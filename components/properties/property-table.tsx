// components/properties/property-table.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Eye,  
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MapPin,
  User,
  Calendar,
  Building2,
} from 'lucide-react';
import type { PropertyListItem, PropertySort } from '@/types/property-types';
import { PropertyClassification, PropertyStatus } from '@prisma/client';
import { format } from 'date-fns';

interface PropertyTableProps {
  properties: PropertyListItem[];
  sort: PropertySort;
  onSortChange: (sort: PropertySort) => void;
  onViewProperty: (propertyId: string) => void;
  onDeleteProperty: (propertyId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function PropertyTable({
  properties,
  sort,
  onSortChange,
  onViewProperty,
  onDeleteProperty,
  canDelete,
}: PropertyTableProps) {
  const handleSort = (field: PropertySort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        order: sort.order === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({ field, order: 'asc' });
    }
  };

  const getSortIcon = (field: PropertySort['field']) => {
    if (sort.field !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-muted-foreground" />;
    }
    return sort.order === 'asc' ? 
      <ArrowUp className="h-4 w-4 ml-2 text-blue-600" /> : 
      <ArrowDown className="h-4 w-4 ml-2 text-blue-600" />;
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const variants: Record<PropertyStatus, { className: string }> = {
      ACTIVE: { className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200' },
      INACTIVE: { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200' },
      PENDING: { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200' },
      RELEASED: { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200' },
      RETURNED: { className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200' },
      UNDER_REVIEW: { className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200' },
      DISPUTED: { className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200' },
    };

    const config = variants[status];
    return (
      <Badge className={`${config.className} font-medium`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getClassificationBadge = (classification: PropertyClassification) => {
    const colors: Record<PropertyClassification, string> = {
      RESIDENTIAL: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
      COMMERCIAL: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
      INDUSTRIAL: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50',
      AGRICULTURAL: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50',
      INSTITUTIONAL: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50',
      MIXED_USE: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50',
      VACANT_LOT: 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50',
      OTHER: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-50',
    };

    return (
      <Badge variant="outline" className={`${colors[classification]} font-medium`}>
        {classification.replace('_', ' ')}
      </Badge>
    );
  };

  const formatArea = (area: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(area);
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null }) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Building2 className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No properties found</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No properties match your current search criteria. Try adjusting your filters or add a new property to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('titleNumber')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Title Number
                {getSortIcon('titleNumber')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('lotNumber')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Lot Number
                {getSortIcon('lotNumber')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('location')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Location
                {getSortIcon('location')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold text-center">
              <Button
                variant="ghost"
                onClick={() => handleSort('area')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Area (sqm)
                {getSortIcon('area')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('registeredOwner')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Owner
                {getSortIcon('registeredOwner')}
              </Button>
            </TableHead>
            <TableHead className="font-semibold">Classification</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">
              <Button
                variant="ghost"
                onClick={() => handleSort('createdAt')}
                className="h-auto p-0 font-semibold hover:bg-transparent hover:text-blue-600 transition-colors"
              >
                Created
                {getSortIcon('createdAt')}
              </Button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => (
            <TableRow key={property.id} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onViewProperty(property.id)}
                    className="font-semibold text-blue-700 hover:text-blue-800 hover:underline transition-colors"
                  >
                    {property.titleNumber}
                  </button>
                  {property._count.documents > 0 && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                      {property._count.documents} docs
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{property.lotNumber}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 max-w-[200px]">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate" title={property.location}>
                    {property.location}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center font-semibold">
                {formatArea(property.area)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 max-w-[150px]">
                  <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate" title={property.registeredOwner}>
                    {property.registeredOwner}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {getClassificationBadge(property.propertyClassification)}
              </TableCell>
              <TableCell>
                {getStatusBadge(property.status)}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(property.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  by {getUserName(property.createdBy)}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted transition-colors">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-semibold">Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewProperty(property.id)}>
                      <Eye className="mr-2 h-4 w-4 text-blue-600" />
                      View & Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {canDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDeleteProperty(property.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Property
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}