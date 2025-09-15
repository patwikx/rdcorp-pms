// components/properties/property-create-form.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PropertyClassification, PropertyStatus } from '@prisma/client';

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
  Tag
} from 'lucide-react';

const propertyFormSchema = z.object({
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
  propertyClassification: z.enum(PropertyClassification),
  status: z.nativeEnum(PropertyStatus),
  remarks: z.string().optional(),
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
          {/* Property Details - Two Column Layout */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
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
                          Unique identifier for the property title
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
                          />
                        </FormControl>
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
                          Property Classification *
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
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
                </div>

                {/* Right Column */}
                <div className="space-y-6">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 mt-8">
                          <Tag className="h-4 w-4" />
                          Status *
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={isLoading}
                        >
                          <FormControl>
                            <SelectTrigger className="h-11">
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter property description" 
                            disabled={isLoading}
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ownership & Financial Information */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                      <FormLabel>Registered Owner <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter registered owner name" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="custodyOriginalTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custody of Original Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter who has custody of original title" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
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
                      <FormLabel>Borrower/Mortgagor</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter borrower/mortgagor name" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter bank name" 
                          disabled={isLoading}
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Additional Details - Full Width */}
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
                    <FormLabel>Encumbrance/Mortgage</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter encumbrance or mortgage details" 
                        disabled={isLoading}
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional remarks or notes" 
                        disabled={isLoading}
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4">
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Property
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}