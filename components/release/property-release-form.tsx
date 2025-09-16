'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ReleaseType } from '@prisma/client';
import { 
  CalendarIcon, 
  Building2, 
  MapPin, 
  FileText, 
  Send, 
  Check, 
  ChevronsUpDown,
} from 'lucide-react';
import { format } from 'date-fns';

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
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { 
  PropertyReleaseFormData,
  ReleaseDestinationOption 
} from '@/types/release-types';
import type { PropertySubset } from '@/types/release-types';

const releaseFormSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  releaseType: z.nativeEnum(ReleaseType),
  businessUnitId: z.string().optional(),
  bankId: z.string().optional(),
  expectedReturnDate: z.date().optional(),
  purposeOfRelease: z.string().min(1, 'Purpose of release is required'),
  receivedByName: z.string().optional(),
  transmittalNumber: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // For subsidiary release, businessUnitId is required
  if (data.releaseType === ReleaseType.TO_SUBSIDIARY && !data.businessUnitId) {
    return false;
  }
  // For bank release, bankId is required
  if (data.releaseType === ReleaseType.TO_BANK && !data.bankId) {
    return false;
  }
  // For external release, receivedByName is required
  if (data.releaseType === ReleaseType.TO_EXTERNAL && !data.receivedByName) {
    return false;
  }
  return true;
}, {
  message: "Required field based on release type",
  path: ["receivedByName"], // This will show error on the appropriate field
});

type ReleaseFormData = z.infer<typeof releaseFormSchema>;

interface PropertyReleaseFormProps {
  properties: PropertySubset[];
  destinations: ReleaseDestinationOption[];
  onSubmit: (data: PropertyReleaseFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialData?: Partial<PropertyReleaseFormData>;
}

export function PropertyReleaseForm({
  properties,
  destinations,
  onSubmit,
  onCancel,
  isLoading = false,
  initialData,
}: PropertyReleaseFormProps) {
  const [selectedProperty, setSelectedProperty] = useState<PropertySubset | null>(null);
  const [filteredDestinations, setFilteredDestinations] = useState<ReleaseDestinationOption[]>([]);
  const [propertyOpen, setPropertyOpen] = useState(false);
  const [destinationOpen, setDestinationOpen] = useState(false);

  const form = useForm<ReleaseFormData>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      propertyId: initialData?.propertyId || '',
      releaseType: initialData?.releaseType || ReleaseType.TO_SUBSIDIARY,
      businessUnitId: initialData?.businessUnitId || '',
      bankId: initialData?.bankId || '',
      expectedReturnDate: initialData?.expectedReturnDate,
      purposeOfRelease: initialData?.purposeOfRelease || '',
      receivedByName: initialData?.receivedByName || '',
      transmittalNumber: initialData?.transmittalNumber || '',
      notes: initialData?.notes || '',
    },
  });

  const watchedReleaseType = form.watch('releaseType');
  const watchedPropertyId = form.watch('propertyId');
  const watchedBusinessUnitId = form.watch('businessUnitId');
  const watchedBankId = form.watch('bankId');

  // Update selected property when propertyId changes
  useEffect(() => {
    if (watchedPropertyId) {
      const property = properties.find(p => p.id === watchedPropertyId);
      setSelectedProperty(property || null);
    } else {
      setSelectedProperty(null);
    }
  }, [watchedPropertyId, properties]);

  // Filter destinations based on release type
  useEffect(() => {
    if (watchedReleaseType === ReleaseType.TO_SUBSIDIARY) {
      setFilteredDestinations(destinations.filter(d => d.type === 'BUSINESS_UNIT'));
      form.setValue('bankId', '');
    } else if (watchedReleaseType === ReleaseType.TO_BANK) {
      setFilteredDestinations(destinations.filter(d => d.type === 'BANK'));
      form.setValue('businessUnitId', '');
    } else {
      setFilteredDestinations([]);
      form.setValue('businessUnitId', '');
      form.setValue('bankId', '');
    }
  }, [watchedReleaseType, destinations, form]);

  const handleSubmit = async (data: ReleaseFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting release form:', error);
    }
  };

  const getReleaseTypeLabel = (type: ReleaseType) => {
    switch (type) {
      case ReleaseType.TO_SUBSIDIARY:
        return 'To Subsidiary';
      case ReleaseType.TO_BANK:
        return 'To Bank';
      case ReleaseType.TO_EXTERNAL:
        return 'To External Party';
      default:
        return type;
    }
  };

  const getSelectedProperty = () => {
    return properties.find(p => p.id === watchedPropertyId);
  };

  const getSelectedDestination = () => {
    const destinationId = watchedReleaseType === ReleaseType.TO_SUBSIDIARY 
      ? watchedBusinessUnitId 
      : watchedBankId;
    return filteredDestinations.find(d => d.id === destinationId);
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
                              "Select property to release..."
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
                    
                    <div className="pt-2 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Status:</span>
                          <span className="ml-1 font-medium text-slate-700">{selectedProperty.status}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Title:</span>
                          <span className="ml-1 font-medium text-slate-700">{selectedProperty.titleNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Release Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5 text-green-600" />
                Release Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="releaseType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Release Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select release type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(ReleaseType).map((type) => (
                            <SelectItem key={type} value={type}>
                              {getReleaseTypeLabel(type)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchedReleaseType === ReleaseType.TO_SUBSIDIARY && (
                  <FormField
                    control={form.control}
                    name="businessUnitId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Destination Subsidiary *</FormLabel>
                        <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={destinationOpen}
                                className="w-full h-11 justify-between"
                              >
                                {field.value ? (
                                  <span className="truncate">
                                    {getSelectedDestination()?.name}
                                  </span>
                                ) : (
                                  "Select subsidiary..."
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search subsidiaries..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>No subsidiary found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredDestinations.map((destination) => (
                                    <CommandItem
                                      key={destination.id}
                                      value={`${destination.name} ${destination.details || ''}`}
                                      onSelect={() => {
                                        form.setValue('businessUnitId', destination.id);
                                        setDestinationOpen(false);
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

                {watchedReleaseType === ReleaseType.TO_BANK && (
                  <FormField
                    control={form.control}
                    name="bankId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Destination Bank *</FormLabel>
                        <Popover open={destinationOpen} onOpenChange={setDestinationOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={destinationOpen}
                                className="w-full h-11 justify-between"
                              >
                                {field.value ? (
                                  <span className="truncate">
                                    {getSelectedDestination()?.name}
                                  </span>
                                ) : (
                                  "Select bank..."
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search banks..." className="h-9" />
                              <CommandList>
                                <CommandEmpty>No bank found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredDestinations.map((destination) => (
                                    <CommandItem
                                      key={destination.id}
                                      value={`${destination.name} ${destination.details || ''}`}
                                      onSelect={() => {
                                        form.setValue('bankId', destination.id);
                                        setDestinationOpen(false);
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

                {watchedReleaseType === ReleaseType.TO_EXTERNAL && (
                  <FormField
                    control={form.control}
                    name="receivedByName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Received By (External Party) *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter name of external recipient" 
                            className="h-11"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Name of the person or organization receiving the property
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="expectedReturnDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expected Return Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-11 pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        When do you expect the property to be returned?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transmittalNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transmittal Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter transmittal reference number" 
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Reference number for tracking the release
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="purposeOfRelease"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Purpose of Release *
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the purpose and reason for releasing this property..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Provide detailed information about why the property is being released
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
                      Optional notes or special instructions for the release
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
                  Creating Release...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Release
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}