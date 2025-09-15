// components/properties/property-create-form.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PropertyClassification, PropertyLocation, PropertyStatus } from '@prisma/client';

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createProperty } from '@/lib/actions/property-actions';
import { 
  Loader2, 
  Save, 
  X,  
  Building2, 
  FileText, 
  User, 
  CreditCard,
  MapPin,
  Hash,
  Ruler,
  Tag,
  Archive
} from 'lucide-react';

const propertyFormSchema = z.object({
  propertyName: z.string().min(1, 'Property name is required'),
  titleNumber: z.string().min(1, 'Title number is required'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  location: z.string().min(1, 'Location is required'),
  area: z.number().min(0.01, 'Area must be greater than 0'),
  description: z.string().optional(),
  registeredOwner: z.string().min(1, 'Registered owner is required'),
  encumbranceMortgage: z.string().optional(),
  borrowerMortgagor: z.string().optional(),
  bank: z.string().optional(),
  custodyOriginalTitle: z.string().optional(),
  propertyClassification: z.nativeEnum(PropertyClassification),
  status: z.nativeEnum(PropertyStatus),
  remarks: z.string().optional(),
  currentLocation: z.nativeEnum(PropertyLocation)
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

interface PropertyCreateFormProps {
  businessUnitId: string;
}

export function PropertyCreateForm({ businessUnitId }: PropertyCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      propertyName: '',
      titleNumber: '',
      lotNumber: '',
      location: '',
      area: 0,
      description: '',
      registeredOwner: '',
      encumbranceMortgage: '',
      borrowerMortgagor: '',
      bank: '',
      custodyOriginalTitle: '',
      propertyClassification: PropertyClassification.RESIDENTIAL,
      status: PropertyStatus.ACTIVE,
      remarks: '',
      currentLocation: PropertyLocation.MAIN_OFFICE
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    
    try {
      const result = await createProperty(businessUnitId, data);
      
      if (result.success && result.propertyId) {
        toast.success('Property created successfully');
        startTransition(() => {
          router.push(`/${businessUnitId}/properties`);
        });
      } else {
        toast.error(result.error || 'Failed to create property');
      }
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    startTransition(() => {
      router.push(`/${businessUnitId}/properties`);
    });
  };

  const isLoading = isPending || isSubmitting;

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Basic Property Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Left side - Basic fields */}
                <div className="xl:col-span-3 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="propertyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Property Name *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter property name" 
                              disabled={isLoading}
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Descriptive name for the property
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="titleNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Title Number *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter title number" 
                              disabled={isLoading}
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Official property title number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lotNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Hash className="h-4 w-4" />
                            Lot Number *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter lot number" 
                              disabled={isLoading}
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Surveyed lot identification
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Location *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter complete address/location" 
                              disabled={isLoading}
                              className="h-11"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Complete property address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Area (sqm) *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="Enter area in square meters" 
                              disabled={isLoading}
                              className="h-11"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            Total property area in square meters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Property Description
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter detailed property description..." 
                              disabled={isLoading}
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Optional detailed description of the property
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Right side - Status, Classification, Location */}
                <div className="xl:col-span-1">
                  <Card className="h-fit">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <Tag className="h-5 w-5 text-indigo-600" />
        Status & Classification
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Status *
            </FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={PropertyStatus.ACTIVE}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    Active
                  </div>
                </SelectItem>
                <SelectItem value={PropertyStatus.PENDING}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    Pending
                  </div>
                </SelectItem>
                <SelectItem value={PropertyStatus.UNDER_REVIEW}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full" />
                    Under Review
                  </div>
                </SelectItem>
                <SelectItem value={PropertyStatus.INACTIVE}>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-gray-500 rounded-full" />
                    Inactive
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="propertyClassification"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Classification *
            </FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={PropertyClassification.RESIDENTIAL}>Residential</SelectItem>
                <SelectItem value={PropertyClassification.COMMERCIAL}>Commercial</SelectItem>
                <SelectItem value={PropertyClassification.INDUSTRIAL}>Industrial</SelectItem>
                <SelectItem value={PropertyClassification.AGRICULTURAL}>Agricultural</SelectItem>
                <SelectItem value={PropertyClassification.INSTITUTIONAL}>Institutional</SelectItem>
                <SelectItem value={PropertyClassification.MIXED_USE}>Mixed Use</SelectItem>
                <SelectItem value={PropertyClassification.VACANT_LOT}>Vacant Lot</SelectItem>
                <SelectItem value={PropertyClassification.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="currentLocation"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              Location *
            </FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select current location" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={PropertyLocation.MAIN_OFFICE}>Main Office</SelectItem>
                <SelectItem value={PropertyLocation.SUBSIDIARY_COMPANY}>Branch Office</SelectItem>
                <SelectItem value={PropertyLocation.BANK_CUSTODY}>Bank Custody</SelectItem>
                <SelectItem value={PropertyLocation.EXTERNAL_HOLDER}>External</SelectItem>
                <SelectItem value={PropertyLocation.IN_TRANSIT}>In-transit</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Where the property documents are currently stored
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </CardContent>
  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ownership & Financial Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ownership Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Ownership Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="registeredOwner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Registered Owner *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter registered owner name" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Legal owner as per property title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custodyOriginalTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Custody of Original Title
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Who has custody of original title" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Person/entity holding the original title
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Financial Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="borrowerMortgagor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Borrower/Mortgagor
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter borrower/mortgagor name" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Person who borrowed against the property
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Bank/Financial Institution
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter bank or financial institution" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Lending institution if applicable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

             {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="encumbranceMortgage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Encumbrance/Mortgage Details
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter details about any encumbrances, mortgages, or liens on the property..." 
                        disabled={isLoading}
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Information about loans, liens, or other encumbrances
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Additional Remarks
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional notes, special conditions, or important information..." 
                        disabled={isLoading}
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Any other relevant information or notes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          </div>

         

          <Separator />

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Fields marked with * are required
            </div>
            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                size="lg"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Property...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Property
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}