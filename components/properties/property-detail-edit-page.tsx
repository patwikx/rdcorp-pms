'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PropertyClassification, PropertyStatus } from '@prisma/client';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardFooter
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { updateProperty } from '@/lib/actions/property-actions';
import {
  Loader2,
  X,
  Building2,
  FileText,
  User,
  CreditCard,
  MapPin,
  Hash,
  Ruler,
  Tag,
  Eye,
  Clock,
  CheckCircle,
  Send,
  ArrowLeftRight,
  RotateCcw,
  Download,
  DollarSign,
  Edit2,
  Check,
} from 'lucide-react';
import type { PropertyDetails } from '@/types/property-types';

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
  propertyClassification: z.nativeEnum(PropertyClassification),
  status: z.nativeEnum(PropertyStatus),
  remarks: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

interface PropertyDetailEditPageProps {
  businessUnitId: string;
  property: PropertyDetails;
}

// Helper function to render status badge with refined styles
function getStatusBadge(status: PropertyStatus) {
  const variants: Record<PropertyStatus, { className: string }> = {
    ACTIVE: { className: 'bg-green-100 text-green-800 border-green-200' },
    INACTIVE: { className: 'bg-slate-100 text-slate-800 border-slate-200' },
    PENDING: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    RELEASED: { className: 'bg-blue-100 text-blue-800 border-blue-200' },
    RETURNED: { className: 'bg-purple-100 text-purple-800 border-purple-200' },
    UNDER_REVIEW: { className: 'bg-orange-100 text-orange-800 border-orange-200' },
    DISPUTED: { className: 'bg-red-100 text-red-800 border-red-200' },
  };

  const config = variants[status] || variants.INACTIVE;
  return (
    <Badge variant="outline" className={`${config.className} font-medium tracking-wide`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

// Helper function to render classification badge with refined styles
function getClassificationBadge(classification: PropertyClassification) {
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
    <Badge variant="outline" className={`${colors[classification]} font-medium tracking-wide`}>
      {classification.replace(/_/g, ' ')}
    </Badge>
  );
}

export function PropertyDetailEditPage({ businessUnitId, property }: PropertyDetailEditPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      titleNumber: property.titleNumber || '',
      lotNumber: property.lotNumber || '',
      location: property.location || '',
      area: Number(property.area) || 0,
      description: property.description || '',
      registeredOwner: property.registeredOwner || '',
      encumbranceMortgage: property.encumbranceMortgage || '',
      borrowerMortgagor: property.borrowerMortgagor || '',
      bank: property.bank || '',
      custodyOriginalTitle: property.custodyOriginalTitle || '',
      propertyClassification: property.propertyClassification || PropertyClassification.RESIDENTIAL,
      status: property.status || PropertyStatus.ACTIVE,
      remarks: property.remarks || '',
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);

    try {
      const result = await updateProperty(businessUnitId, property.id, data);

      if (result.success) {
        toast.success('Property updated successfully');
        setIsEditing(false);
        startTransition(() => {
          router.refresh();
        });
      } else {
        toast.error(result.error || 'Failed to update property');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.reset();
  };

  const formatArea = (area: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(area);
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null } | null) => {
    if (!user) return 'Unknown User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const isLoading = isPending || isSubmitting;

  return (
    <div className="space-y-6 p-4 min-h-screen">
      {/* Property Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200/60">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">

            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {property.titleNumber}
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs bg-slate-50 border-slate-300">
                  Lot {property.lotNumber}
                </Badge>
                {getStatusBadge(property.status)}
                {getClassificationBadge(property.propertyClassification)}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <MapPin className="h-5 w-5 text-slate-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-slate-900 truncate">{property.location}</p>
            </div>
          </div>
          <div className="flex space-x-3 ml-6">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Property
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isLoading}
                  className="border-slate-300 hover:bg-slate-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="min-w-[120px] bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1 space-x-4 rounded-lg shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Documents
            {property._count.documents > 0 && (
              <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
                {property._count.documents}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="workflow" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Workflow
            {(property._count.approvals + property._count.releases + property._count.turnovers + property._count.returns) > 0 && (
              <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
                {property._count.approvals + property._count.releases + property._count.turnovers + property._count.returns}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="tax" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200">
            Tax Records
            {property._count.rptRecords > 0 && (
              <Badge variant="secondary" className="ml-2 bg-slate-100 text-slate-600 text-xs">
                {property._count.rptRecords}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview" className="space-y-6">
            {isEditing ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <CardTitle className="text-lg flex items-center gap-3 text-slate-900">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Property Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                        <FormField
                          control={form.control}
                          name="titleNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-slate-700">
                                <Hash className="h-4 w-4" />
                                Title Number <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter title number"
                                  disabled={isLoading}
                                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-slate-500">Unique identifier for the property title</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lotNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-slate-700">
                                <Hash className="h-4 w-4" />
                                Lot Number <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter lot number"
                                  disabled={isLoading}
                                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                              <FormLabel className="flex items-center gap-2 text-slate-700">
                                <Ruler className="h-4 w-4" />
                                Area (sqm) <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Enter area in square meters"
                                  disabled={isLoading}
                                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                              <FormLabel className="flex items-center gap-2 text-slate-700">
                                <Tag className="h-4 w-4" />
                                Property Classification <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoading}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                                    <SelectValue placeholder="Select classification" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white border-slate-200">
                                  {Object.values(PropertyClassification).map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type.replace(/_/g, ' ')}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2 text-slate-700">
                                <MapPin className="h-4 w-4" />
                                Location <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter complete address/location"
                                  disabled={isLoading}
                                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                              <FormLabel className="flex items-center gap-2 text-slate-700">
                                <Tag className="h-4 w-4" />
                                Status <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                disabled={isLoading}
                              >
                                <FormControl>
                                  <SelectTrigger className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white border-slate-200">
                                  {Object.values(PropertyStatus).map((status) => (
                                    <SelectItem key={status} value={status}>
                                      <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${getStatusDotClass(status)}`} />
                                        {status.replace(/_/g, ' ')}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="lg:col-span-2">
                           <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700">Property Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter property description"
                                    disabled={isLoading}
                                    rows={4}
                                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <CardTitle className="text-lg flex items-center gap-3 text-slate-900">
                          <User className="h-5 w-5 text-green-600" />
                          Ownership Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <FormField
                          control={form.control}
                          name="registeredOwner"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">Registered Owner <span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter registered owner name"
                                  disabled={isLoading}
                                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                              <FormLabel className="text-slate-700">Custody of Original Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter who has custody of original title"
                                  disabled={isLoading}
                                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        <CardTitle className="text-lg flex items-center gap-3 text-slate-900">
                          <CreditCard className="h-5 w-5 text-purple-600" />
                          Financial Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <FormField
                          control={form.control}
                          name="borrowerMortgagor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-slate-700">Borrower/Mortgagor</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter borrower/mortgagor name"
                                  disabled={isLoading}
                                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                              <FormLabel className="text-slate-700">Bank</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter bank name"
                                  disabled={isLoading}
                                  className="h-11 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                  <Card className="bg-white border-slate-200 shadow-sm">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <CardTitle className="text-lg flex items-center gap-3 text-slate-900">
                        <FileText className="h-5 w-5 text-orange-600" />
                        Encumbrance/Remarks
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <FormField
                        control={form.control}
                        name="encumbranceMortgage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-700">Encumbrance/Mortgage</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter encumbrance or mortgage details"
                                disabled={isLoading}
                                rows={3}
                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
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
                            <FormLabel className="text-slate-700">Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any additional remarks or notes"
                                disabled={isLoading}
                                rows={4}
                                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </form>
              </Form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Basic Information */}
                  <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <CardTitle className="flex items-center gap-3 text-slate-900">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Title Number</span>
                        <p className="text-sm font-semibold text-slate-900 font-mono">{property.titleNumber}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Lot Number</span>
                        <p className="text-sm font-semibold text-slate-900">{property.lotNumber}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Area</span>
                        <p className="text-sm font-semibold text-slate-900">{formatArea(Number(property.area))} sqm</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Classification</span>
                        {getClassificationBadge(property.propertyClassification)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Tax Declaration</span>
                        <p className="text-sm font-semibold text-slate-900">{property.taxDeclaration || 'Not specified'}</p>
                      </div>
                      {property.description && (
                        <div>
                          <label className="text-sm font-medium text-slate-500">Description</label>
                          <p className="text-sm text-slate-800 mt-1">{property.description}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Ownership Information */}
                  <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <CardTitle className="flex items-center gap-3 text-slate-900">
                        <User className="h-5 w-5 text-green-600" />
                        Ownership Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Registered Owner</span>
                        <p className="text-sm font-semibold text-slate-900">{property.registeredOwner}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-500">Custody of Original Title</span>
                        <p className="text-sm font-semibold text-slate-900">{property.custodyOriginalTitle || 'Not specified'}</p>
                      </div>
                      {property.encumbranceMortgage && (
                        <div>
                          <label className="text-sm font-medium text-slate-500">Encumbrance/Mortgage</label>
                          <p className="text-sm text-slate-800 mt-1">{property.encumbranceMortgage}</p>
                        </div>
                      )}
                      {property.borrowerMortgagor && (
                        <div>
                          <label className="text-sm font-medium text-slate-500">Borrower/Mortgagor</label>
                          <p className="text-sm text-slate-800 mt-1">{property.borrowerMortgagor}</p>
                        </div>
                      )}
                      {property.bank && (
                        <div>
                          <label className="text-sm font-medium text-slate-500">Bank</label>
                          <p className="text-sm text-slate-800 mt-1">{property.bank}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* System Information */}
                  <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <CardTitle className="flex items-center gap-3 text-slate-900">
                        <Clock className="h-5 w-5 text-purple-600" />
                        System Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">Created By</label>
                        <p className="text-sm font-semibold text-slate-900">{getUserName(property.createdBy)}</p>
                        <p className="text-xs text-slate-600">
                          {format(new Date(property.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">Last Updated</label>
                        <p className="text-sm font-semibold text-slate-900">
                          {property.updatedBy ? getUserName(property.updatedBy) : 'Never updated'}
                        </p>
                        <p className="text-xs text-slate-600">
                          {format(new Date(property.updatedAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500">Business Unit</label>
                        <p className="text-sm font-semibold text-slate-900">{property.businessUnit.name}</p>
                      </div>
                      {property.remarks && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-500">Remarks</label>
                          <p className="text-sm text-slate-800">{property.remarks}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            {property.documents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-500 mb-2">No documents found</h3>
                <p className="text-sm text-slate-400">
                  No documents have been uploaded for this property yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {property.documents.map((document) => (
                  <Card key={document.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-slate-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{document.originalName}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            <span className="capitalize">{document.documentType.replace(/_/g, ' ')}</span> •
                            {(document.fileSize / 1024 / 1024).toFixed(2)} MB •
                            Uploaded by {getUserName(document.createdBy)} on {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-blue-50 hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-blue-50 hover:text-blue-600">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workflow" className="space-y-4">
            {property.approvals.length > 0 && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <CardTitle className="text-lg flex items-center gap-3 text-slate-900">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Approvals
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {property.approvals.map((approval) => (
                    <div key={approval.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">
                          {getUserName(approval.approver)}
                        </p>
                        <p className="text-xs text-slate-600">
                          {approval.approvedAt
                            ? format(new Date(approval.approvedAt), 'MMM dd, yyyy HH:mm')
                            : format(new Date(approval.createdAt), 'MMM dd, yyyy HH:mm')}
                        </p>
                        {approval.comments && (
                          <p className="text-xs text-slate-500 mt-1 italic">{approval.comments}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={approval.status === 'APPROVED' ? 'bg-green-100 text-green-800 border-green-200' : approval.status === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                        {approval.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {property.releases.length > 0 && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <CardTitle className="text-lg flex items-center gap-3 text-slate-900">
                    <Send className="h-5 w-5 text-blue-600" />
                    Releases
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {property.releases.map((release) => (
                    <div key={release.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Released By</label>
                          <p className="text-slate-900 font-medium">{release.releasedBy ? getUserName(release.releasedBy) : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Date Released</label>
                          <p className="text-slate-900 font-medium">{release.dateReleased ? format(new Date(release.dateReleased), 'MMM dd, yyyy') : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Approved By</label>
                          <p className="text-slate-900 font-medium">{release.approvedBy ? getUserName(release.approvedBy) : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Received By</label>
                          <p className="text-slate-900 font-medium">{release.receivedBy ? getUserName(release.receivedBy) : 'Not specified'}</p>
                        </div>
                      </div>
                      {release.purposeOfRelease && (
                        <div className="mt-4 space-y-1">
                          <label className="font-medium text-slate-500 text-sm">Purpose</label>
                          <p className="text-sm text-slate-800">{release.purposeOfRelease}</p>
                        </div>
                      )}
                      {release.transmittalNumber && (
                        <div className="mt-4 space-y-1">
                          <label className="font-medium text-slate-500 text-sm">Transmittal Number</label>
                          <p className="text-sm font-mono text-slate-800">{release.transmittalNumber}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {property.turnovers.length > 0 && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <CardTitle className="text-lg flex items-center gap-3 text-slate-900">
                    <ArrowLeftRight className="h-5 w-5 text-orange-600" />
                    Turnovers
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {property.turnovers.map((turnover) => (
                    <div key={turnover.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Turned Over By</label>
                          <p className="text-slate-900 font-medium">{turnover.turnedOverBy ? getUserName(turnover.turnedOverBy) : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Date</label>
                          <p className="text-slate-900 font-medium">{turnover.turnedOverDate ? format(new Date(turnover.turnedOverDate), 'MMM dd, yyyy') : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Received By</label>
                          <p className="text-slate-900 font-medium">{turnover.receivedBy ? getUserName(turnover.receivedBy) : 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {property.returns.length > 0 && (
              <Card className="bg-white border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <CardTitle className="text-lg flex items-center gap-3 text-slate-900">
                    <RotateCcw className="h-5 w-5 text-red-600" />
                    Returns
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {property.returns.map((returnRecord) => (
                    <div key={returnRecord.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Returned By</label>
                          <p className="text-slate-900 font-medium">{returnRecord.returnedBy ? getUserName(returnRecord.returnedBy) : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Date Returned</label>
                          <p className="text-slate-900 font-medium">{returnRecord.dateReturned ? format(new Date(returnRecord.dateReturned), 'MMM dd, yyyy') : 'Not specified'}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Received By</label>
                          <p className="text-slate-900 font-medium">{returnRecord.receivedBy ? getUserName(returnRecord.receivedBy) : 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {(property.approvals.length === 0 && property.releases.length === 0 &&
              property.turnovers.length === 0 && property.returns.length === 0) && (
                <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <ArrowLeftRight className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-500 mb-2">No workflow history</h3>
                  <p className="text-sm text-slate-400">
                    No approvals, releases, turnovers, or returns have been recorded for this property.
                  </p>
                </div>
              )}
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            {property.rptRecords.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-slate-200 shadow-sm">
                <DollarSign className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-500 mb-2">No tax records found</h3>
                <p className="text-sm text-slate-400">
                  No real property tax records have been added for this property yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {property.rptRecords.map((rpt) => (
                  <Card key={rpt.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                        <h4 className="font-medium text-slate-900">Tax Year {rpt.taxYear}</h4>
                        <Badge variant="outline" className={rpt.status === 'FULLY_PAID' ? 'bg-green-100 text-green-800 border-green-200' : rpt.status === 'PARTIALLY_PAID' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-red-100 text-red-800 border-red-200'}>
                          {rpt.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Assessed Value</label>
                          <p className="text-slate-900 font-medium">₱{Number(rpt.assessedValue).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Total Amount Due</label>
                          <p className="text-slate-900 font-medium">₱{Number(rpt.totalAmountDue).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Payment Schedule</label>
                          <p className="text-slate-900 font-medium">{rpt.paymentSchedule.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-slate-500">Due Date</label>
                          <p className="text-slate-900 font-medium">{format(new Date(rpt.dueDate), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Helper function for status dot colors in Select
const getStatusDotClass = (status: PropertyStatus) => {
  switch (status) {
    case PropertyStatus.ACTIVE:
      return 'bg-green-500';
    case PropertyStatus.PENDING:
      return 'bg-yellow-500';
    case PropertyStatus.UNDER_REVIEW:
      return 'bg-blue-500';
    case PropertyStatus.INACTIVE:
      return 'bg-gray-500';
    case PropertyStatus.RELEASED:
      return 'bg-blue-500';
    case PropertyStatus.RETURNED:
      return 'bg-purple-500';
    case PropertyStatus.DISPUTED:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};