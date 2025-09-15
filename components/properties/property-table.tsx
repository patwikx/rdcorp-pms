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
  Edit, 
  Trash2, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  MapPin,
  User,
  Calendar
} from 'lucide-react';
import type { PropertyListItem, PropertySort } from '@/types/property-types';
import { PropertyClassification, PropertyStatus } from '@prisma/client';
import { format } from 'date-fns';

interface PropertyTableProps {
  properties: PropertyListItem[];
  sort: PropertySort;
  onSortChange: (sort: PropertySort) => void;
  onViewProperty: (propertyId: string) => void;
  onEditProperty: (propertyId: string) => void;
  onDeleteProperty: (propertyId: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function PropertyTable({
  properties,
  sort,
  onSortChange,
  onViewProperty,
  onEditProperty,
  onDeleteProperty,
  canEdit,
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
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sort.order === 'asc' ? 
      <ArrowUp className="h-4 w-4" /> : 
      <ArrowDown className="h-4 w-4" />;
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const variants: Record<PropertyStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      ACTIVE: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      INACTIVE: { variant: 'secondary' },
      PENDING: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      RELEASED: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      RETURNED: { variant: 'default', className: 'bg-purple-100 text-purple-800 hover:bg-purple-100' },
      UNDER_REVIEW: { variant: 'default', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
      DISPUTED: { variant: 'destructive' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getClassificationBadge = (classification: PropertyClassification) => {
    const colors: Record<PropertyClassification, string> = {
      RESIDENTIAL: 'bg-blue-50 text-blue-700 border-blue-200',
      COMMERCIAL: 'bg-green-50 text-green-700 border-green-200',
      INDUSTRIAL: 'bg-gray-50 text-gray-700 border-gray-200',
      AGRICULTURAL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      INSTITUTIONAL: 'bg-purple-50 text-purple-700 border-purple-200',
      MIXED_USE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      VACANT_LOT: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      OTHER: 'bg-slate-50 text-slate-700 border-slate-200',
    };

    return (
      <Badge variant="outline" className={colors[classification]}>
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
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No properties found</h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search criteria or add a new property.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('titleNumber')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Title Number
                {getSortIcon('titleNumber')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('lotNumber')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Lot Number
                {getSortIcon('lotNumber')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('location')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Location
                {getSortIcon('location')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('area')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Area (sqm)
                {getSortIcon('area')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('registeredOwner')}
                className="h-auto p-0 font-medium hover:bg-transparent"
              >
                Owner
                {getSortIcon('registeredOwner')}
              </Button>
            </TableHead>
            <TableHead>Classification</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('createdAt')}
                className="h-auto p-0 font-medium hover:bg-transparent"
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
            <TableRow key={property.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <span>{property.titleNumber}</span>
                  {property._count.documents > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {property._count.documents} docs
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{property.lotNumber}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-1 max-w-[200px]">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="truncate" title={property.location}>
                    {property.location}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
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
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewProperty(property.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {canEdit && (
                      <DropdownMenuItem onClick={() => onEditProperty(property.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Property
                      </DropdownMenuItem>
                    )}
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