// components/turnovers/property-turnover-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TurnoverType } from '@prisma/client';
import { 
  Building2, 
  ArrowLeftRight, 
  FileText, 
  Check, 
  ChevronsUpDown,
  MapPin,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { 
  PropertyTurnoverFormData,
  TurnoverDestinationOption 
} from '@/types/turnover-types';
import type { PropertySubset } from '@/types/turnover-types';

const turnoverFormSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  turnoverType: z.nativeEnum(TurnoverType),
  fromBusinessUnitId: z.string().optional(),
  toBusinessUnitId: z.string().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // For between subsidiaries turnover, both from and to business units are required
  if (data.turnoverType === TurnoverType.BETWEEN_SUBSIDIARIES) {
    return data.fromBusinessUnitId && data.toBusinessUnitId;
  }
  // For custody transfer, toBusinessUnitId is required
  if (data.turnoverType === TurnoverType.CUSTODY_TRANSFER) {
    return data.toBusinessUnitId;
  }
  return true;
}, {
  message: "Required fields based on turnover type",
  path: ["toBusinessUnitId"],
});

type TurnoverFormData = z.infer<typeof turnoverFormSchema>;

interface PropertyTurnoverFormProps {
  properties: PropertySubset[];
  destinations: TurnoverDestinationOption[];
  onSubmit: (data: PropertyTurnoverFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<PropertyTurnoverFormData>;
}

export function PropertyTurnoverForm({
  properties,
  destinations,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: PropertyTurnoverFormProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertySubset | null>(null);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [fromDestinationOpen, setFromDestinationOpen] = useState(false);
  const [toDestinationOpen, setToDestinationOpen] = useState(false);

  const form = useForm<TurnoverFormData>({
    resolver: zodResolver(turnoverFormSchema),
    defaultValues: {
      propertyId: initialData?.propertyId || '',
      turnoverType: initialData?.turnoverType || TurnoverType.INTERNAL_DEPARTMENT,
      fromBusinessUnitId: initialData?.fromBusinessUnitId || '',
      toBusinessUnitId: initialData?.toBusinessUnitId || '',
      purpose: initialData?.purpose || '',
      notes: initialData?.notes || '',
    },
  });

  const watchedTurnoverType = form.watch('turnoverType');
  const watchedPropertyId = form.watch('propertyId');
  const watchedFromBusinessUnitId = form.watch('fromBusinessUnitId');
  const watchedToBusinessUnitId = form.watch('toBusinessUnitId');

  // Update selected property when propertyId changes
  useEffect(() => {
    if (watchedPropertyId) {
      const property = properties.find(p => p.id === watchedPropertyId);
      setSelectedProperty(property || null);
    } else {
      setSelectedProperty(null);
    }
  }, [watchedPropertyId, properties]);

  const handleSubmit = async (data: TurnoverFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting turnover form:', error);
    }
  };

  const getTurnoverTypeLabel = (type: TurnoverType) => {
    switch (type) {
      case TurnoverType.INTERNAL_DEPARTMENT:
        return 'Internal Department';
      case TurnoverType.BETWEEN_SUBSIDIARIES:
        return 'Between Subsidiaries';
      case TurnoverType.CUSTODY_TRANSFER:
        return 'Custody Transfer';
      default:
        return type;
    }
  };

  const getSelectedProperty = () => {
    return properties.find(p => p.id === watchedPropertyId);
  };

  const getSelectedFromDestination = () => {
    return destinations.find(d => d.id === watchedFromBusinessUnitId);
  };

  const getSelectedToDestination = () => {
    return destinations.find(d => d.id === watchedToBusinessUnitId);
  };

  const showFromBusinessUnit = watchedTurnoverType === TurnoverType.BETWEEN_SUBSIDIARIES;
  const showToBusinessUnit = watchedTurnoverType !== TurnoverType.INTERNAL_DEPARTMENT;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Property Selection */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Property Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="propertyId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Property *</FormLabel>
                    <Popover open={propertyOpen} onOpenChange={setPropertyOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={propertyOpen}
                            className="w-[400px] h-11 justify-between"
                          >
                            {field.value ? (
                              <span className="truncate">
                                {getSelectedProperty()?.titleNumber} - {getSelectedProperty()?.propertyName}
                              </span>
                            ) : (
                              "Select property to turnover..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search properties..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No property found.</CommandEmpty>
                            <CommandGroup>
                              {properties.map((property) => (
                                <CommandItem
                                  key={property.id}
                                  value={`${property.titleNumber} ${property.propertyName} ${property.location}`}
                                  onSelect={() => {
                                    form.setValue('propertyId', property.id);
                                    setPropertyOpen(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-2 w-full">
                                    <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                                    <Check
                                      className={cn(
                                        "h-4 w-4",
                                        property.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium">{property.titleNumber}</div>
                                      <div className="text-sm text-muted-foreground">{property.propertyName}</div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {property.location}
                                      </div>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProperty && (
                <div className="border rounded-lg p-4 bg-slate-50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{selectedProperty.titleNumber}</h4>
                        <p className="text-sm text-slate-600">{selectedProperty.propertyName}</p>
                      </div>
                      <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                        {selectedProperty.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedProperty.location}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Turnover Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-green-600" />
                Turnover Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="turnoverType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turnover Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select turnover type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(TurnoverType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {getTurnoverTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {showFromBusinessUnit && (
                  <FormField
                    control={form.control}
                    name="fromBusinessUnitId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>From Business Unit *</FormLabel>
                        <Popover open={fromDestinationOpen} onOpenChange={setFromDestinationOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={fromDestinationOpen}
                                className="w-full h-11 justify-between"
                              >
                                {field.value ? (
                                  <span className="truncate">
                                    {getSelectedFromDestination()?.name}
                                  </span>
                                ) : (
                                  "Select source business unit..."
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search business units..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>No business unit found.</CommandEmpty>
                                <CommandGroup>
                                  {destinations.map((destination) => (
                                    <CommandItem
                                      key={destination.id}
                                      value={`${destination.name} ${destination.details || ''}`}
                                      onSelect={() => {
                                        form.setValue('fromBusinessUnitId', destination.id);
                                        setFromDestinationOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          destination.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div>
                                        <div className="font-medium">{destination.name}</div>
                                        {destination.details && (
                                          <div className="text-sm text-muted-foreground">{destination.details}</div>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {showToBusinessUnit && (
                  <FormField
                    control={form.control}
                    name="toBusinessUnitId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>To Business Unit *</FormLabel>
                        <Popover open={toDestinationOpen} onOpenChange={setToDestinationOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={toDestinationOpen}
                                className="w-full h-11 justify-between"
                              >
                                {field.value ? (
                                  <span className="truncate">
                                    {getSelectedToDestination()?.name}
                                  </span>
                                ) : (
                                  "Select destination business unit..."
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search business units..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>No business unit found.</CommandEmpty>
                                <CommandGroup>
                                  {destinations.map((destination) => (
                                    <CommandItem
                                      key={destination.id}
                                      value={`${destination.name} ${destination.details || ''}`}
                                      onSelect={() => {
                                        form.setValue('toBusinessUnitId', destination.id);
                                        setToDestinationOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          destination.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div>
                                        <div className="font-medium">{destination.name}</div>
                                        {destination.details && (
                                          <div className="text-sm text-muted-foreground">{destination.details}</div>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Purpose of Turnover
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose and reason for this property turnover..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide detailed information about why the property is being turned over
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes or special instructions..." 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Optional notes or special instructions for the turnover
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              size="lg"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !selectedProperty} 
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Turnover...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />
                  Create Turnover
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}