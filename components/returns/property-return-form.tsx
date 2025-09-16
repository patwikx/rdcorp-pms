// components/returns/property-return-form.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ReturnType } from '@prisma/client';
import { 
  Building2, 
  RotateCcw, 
  FileText, 
  Check, 
  ChevronsUpDown,
  MapPin,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  PropertyReturnFormData,
  ReturnSourceOption 
} from '@/types/return-types';
import type { PropertySubset } from '@/types/return-types';

const returnFormSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  returnType: z.nativeEnum(ReturnType),
  businessUnitId: z.string().optional(),
  returnedByName: z.string().optional(),
  reasonForReturn: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // For subsidiary return, businessUnitId is required
  if (data.returnType === ReturnType.FROM_SUBSIDIARY && !data.businessUnitId) {
    return false;
  }
  // For external return, returnedByName is required
  if (data.returnType === ReturnType.FROM_EXTERNAL && !data.returnedByName) {
    return false;
  }
  return true;
}, {
  message: "Required field based on return type",
  path: ["returnedByName"],
});

type ReturnFormData = z.infer<typeof returnFormSchema>;

interface PropertyReturnFormProps {
  properties: PropertySubset[];
  sources: ReturnSourceOption[];
  onSubmit: (data: PropertyReturnFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<PropertyReturnFormData>;
}

export function PropertyReturnForm({
  properties,
  sources,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: PropertyReturnFormProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertySubset | null>(null);
  const [filteredSources, setFilteredSources] = useState<ReturnSourceOption[]>([]);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);

  const form = useForm<ReturnFormData>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      propertyId: initialData?.propertyId || '',
      returnType: initialData?.returnType || ReturnType.FROM_SUBSIDIARY,
      businessUnitId: initialData?.businessUnitId || '',
      returnedByName: initialData?.returnedByName || '',
      reasonForReturn: initialData?.reasonForReturn || '',
      condition: initialData?.condition || '',
      notes: initialData?.notes || '',
    },
  });

  const watchedReturnType = form.watch('returnType');
  const watchedPropertyId = form.watch('propertyId');
  const watchedBusinessUnitId = form.watch('businessUnitId');

  // Update selected property when propertyId changes
  useEffect(() => {
    if (watchedPropertyId) {
      const property = properties.find(p => p.id === watchedPropertyId);
      setSelectedProperty(property || null);
    } else {
      setSelectedProperty(null);
    }
  }, [watchedPropertyId, properties]);

  // Filter sources based on return type
  useEffect(() => {
    if (watchedReturnType === ReturnType.FROM_SUBSIDIARY) {
      setFilteredSources(sources.filter(s => s.type === 'BUSINESS_UNIT'));
    } else if (watchedReturnType === ReturnType.FROM_BANK) {
      setFilteredSources(sources.filter(s => s.type === 'BANK'));
    } else {
      setFilteredSources([]);
      form.setValue('businessUnitId', '');
    }
  }, [watchedReturnType, sources, form]);

  const handleSubmit = async (data: ReturnFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting return form:', error);
    }
  };

  const getReturnTypeLabel = (type: ReturnType) => {
    switch (type) {
      case ReturnType.FROM_SUBSIDIARY:
        return 'From Subsidiary';
      case ReturnType.FROM_BANK:
        return 'From Bank';
      case ReturnType.FROM_EXTERNAL:
        return 'From External Party';
      default:
        return type;
    }
  };

  const getSelectedProperty = () => {
    return properties.find(p => p.id === watchedPropertyId);
  };

  const getSelectedSource = () => {
    return filteredSources.find(s => s.id === watchedBusinessUnitId);
  };

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
                              "Select property to return..."
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

          {/* Return Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-orange-600" />
                Return Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="returnType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select return type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ReturnType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {getReturnTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(watchedReturnType === ReturnType.FROM_SUBSIDIARY || watchedReturnType === ReturnType.FROM_BANK) && (
                  <FormField
                    control={form.control}
                    name="businessUnitId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>
                          {watchedReturnType === ReturnType.FROM_SUBSIDIARY ? 'Source Subsidiary *' : 'Source Bank *'}
                        </FormLabel>
                        <Popover open={sourceOpen} onOpenChange={setSourceOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={sourceOpen}
                                className="w-full h-11 justify-between"
                              >
                                {field.value ? (
                                  <span className="truncate">
                                    {getSelectedSource()?.name}
                                  </span>
                                ) : (
                                  `Select ${watchedReturnType === ReturnType.FROM_SUBSIDIARY ? 'subsidiary' : 'bank'}...`
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder={`Search ${watchedReturnType === ReturnType.FROM_SUBSIDIARY ? 'subsidiaries' : 'banks'}...`} className="h-9" />
                              <CommandList>
                                <CommandEmpty>No {watchedReturnType === ReturnType.FROM_SUBSIDIARY ? 'subsidiary' : 'bank'} found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredSources.map((source) => (
                                    <CommandItem
                                      key={source.id}
                                      value={`${source.name} ${source.details || ''}`}
                                      onSelect={() => {
                                        form.setValue('businessUnitId', source.id);
                                        setSourceOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          source.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div>
                                        <div className="font-medium">{source.name}</div>
                                        {source.details && (
                                          <div className="text-sm text-muted-foreground">{source.details}</div>
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

                {watchedReturnType === ReturnType.FROM_EXTERNAL && (
                  <FormField
                    control={form.control}
                    name="returnedByName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Returned By (External Party) *
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter name of external party returning the property" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Name of the person or organization returning the property
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <FormField
                control={form.control}
                name="reasonForReturn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Reason for Return
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the reason for returning this property..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide detailed information about why the property is being returned
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Condition</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the condition of the documents upon return..." 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Note the physical condition of the property documents
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
                      Optional notes or special instructions for the return
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
                  Creating Return...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Create Return
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}