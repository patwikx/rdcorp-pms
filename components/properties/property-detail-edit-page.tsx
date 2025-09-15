/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateProperty } from '@/lib/actions/property-actions';
import {
  Loader2,
  X,
  Building2,
  FileText,
  MapPin,
  Hash,
  CheckCircle,
  DollarSign,
  Edit3,
  User,
  Info,
  Activity,
  Archive,
  Save,
  Eye,
  MoreVertical,
  Download,
  ExternalLink,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Users,
  Landmark,
  Home,
  Factory,
  TreePine,
  School,
  Grid3X3,
  Square,
  HelpCircle,
  Building,
  Clock,
  CheckSquare,
  XCircle,
  Pause,
  RotateCcw,
  AlertCircle,
  Shield,
  CreditCard,
} from 'lucide-react';
import type { PropertyDetails } from '@/types/property-types';

type BankData = { 
  id: string; 
  name: string; 
  branchName: string; 
};

type UserData = { 
  id: string; 
  name: string; 
};

type BankList = BankData[];
type UserList = UserData[];

const propertyFormSchema = z.object({
  propertyName: z.string().optional(),
  titleNumber: z.string().min(1, 'Title number is required'),
  lotNumber: z.string().min(1, 'Lot number is required'),
  location: z.string().min(1, 'Location is required'),
  area: z.number().min(0.01, 'Area must be greater than 0'),
  description: z.string().optional(),
  registeredOwner: z.string().min(1, 'Registered owner is required'),
  encumbranceMortgage: z.string().optional(),
  borrowerMortgagor: z.string().optional(),
  bankId: z.string().optional(),
  custodianId: z.string().min(1, 'Custodian is required'),
  propertyClassification: z.nativeEnum(PropertyClassification),
  status: z.nativeEnum(PropertyStatus),
  remarks: z.string().optional(),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

interface PropertyDetailEditPageProps {
  businessUnitId: string;
  property: PropertyDetails;
  availableBanks: BankList;
  availableCustodians: UserList;
}

const statusConfig = {
  [PropertyStatus.ACTIVE]: { 
    color: 'bg-emerald-500', 
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Active',
    icon: CheckSquare,
    description: 'Property is active and available'
  },
  [PropertyStatus.INACTIVE]: { 
    color: 'bg-gray-500', 
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Inactive',
    icon: Pause,
    description: 'Property is currently inactive'
  },
  [PropertyStatus.PENDING]: { 
    color: 'bg-amber-500', 
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Pending',
    icon: Clock,
    description: 'Pending approval or processing'
  },
  [PropertyStatus.RELEASED]: { 
    color: 'bg-blue-500', 
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Released',
    icon: ExternalLink,
    description: 'Property has been released'
  },
  [PropertyStatus.RETURNED]: { 
    color: 'bg-purple-500', 
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    label: 'Returned',
    icon: RotateCcw,
    description: 'Property has been returned'
  },
  [PropertyStatus.UNDER_REVIEW]: { 
    color: 'bg-orange-500', 
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Under Review',
    icon: AlertCircle,
    description: 'Property is under review'
  },
  [PropertyStatus.DISPUTED]: { 
    color: 'bg-red-500', 
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Disputed',
    icon: XCircle,
    description: 'Property ownership is disputed'
  },
  [PropertyStatus.BANK_CUSTODY]: { 
    color: 'bg-indigo-500', 
    textColor: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    label: 'Bank Custody',
    icon: Shield,
    description: 'Property is in bank custody'
  },
};

const classificationConfig = {
  [PropertyClassification.RESIDENTIAL]: { 
    label: 'Residential', 
    color: 'blue',
    icon: Home,
    description: 'Residential property'
  },
  [PropertyClassification.COMMERCIAL]: { 
    label: 'Commercial', 
    color: 'green',
    icon: Building,
    description: 'Commercial property'
  },
  [PropertyClassification.INDUSTRIAL]: { 
    label: 'Industrial', 
    color: 'gray',
    icon: Factory,
    description: 'Industrial property'
  },
  [PropertyClassification.AGRICULTURAL]: { 
    label: 'Agricultural', 
    color: 'emerald',
    icon: TreePine,
    description: 'Agricultural land'
  },
  [PropertyClassification.INSTITUTIONAL]: { 
    label: 'Institutional', 
    color: 'purple',
    icon: School,
    description: 'Institutional property'
  },
  [PropertyClassification.MIXED_USE]: { 
    label: 'Mixed Use', 
    color: 'indigo',
    icon: Grid3X3,
    description: 'Mixed-use property'
  },
  [PropertyClassification.VACANT_LOT]: { 
    label: 'Vacant Lot', 
    color: 'yellow',
    icon: Square,
    description: 'Vacant lot'
  },
  [PropertyClassification.OTHER]: { 
    label: 'Other', 
    color: 'slate',
    icon: HelpCircle,
    description: 'Other property type'
  },
};

export function PropertyDetailEditPage({ 
  businessUnitId, 
  property,
  availableBanks,
  availableCustodians,
}: PropertyDetailEditPageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      propertyName: property.propertyName || '',
      titleNumber: property.titleNumber || '',
      lotNumber: property.lotNumber || '',
      location: property.location || '',
      area: Number(property.area) || 0,
      description: property.description || '',
      registeredOwner: property.registeredOwner || '',
      encumbranceMortgage: property.encumbranceMortgage || '',
      borrowerMortgagor: property.borrowerMortgagor || '',
      bankId: property.bankId || undefined,
      custodianId: property.custodianId || '',
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

  const formatArea = (area: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(area);
  };

  const formatCurrency = (amount: string | number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP',
    }).format(Number(amount));
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null } | null): string => {
    if (!user) return 'Unknown User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const getUserInitials = (user: { firstName: string | null; lastName: string | null } | null): string => {
    if (!user) return 'UN';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'UN';
  };

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('image')) return Eye;
    if (mimeType.includes('document') || mimeType.includes('word')) return FileText;
    return FileText;
  };

  const isLoading = isPending || isSubmitting;
  const currentStatus = statusConfig[property.status];
  const currentClassification = classificationConfig[property.propertyClassification];
  const StatusIcon = currentStatus.icon;
  const ClassificationIcon = currentClassification.icon;

  const totalActivityCount = property._count.approvalRequests + 
    property._count.releases + 
    property._count.turnovers + 
    property._count.returns;

  // Enhanced Property Header
  const PropertyHeader = () => (
    <div className=" rounded-xl mb-8">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className={`p-3 rounded-xl ${currentStatus.bgColor} ${currentStatus.borderColor} border`}>
                <StatusIcon className={`h-6 w-6 ${currentStatus.textColor}`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {property.propertyName || `Property ${property.lotNumber}`}
                </h1>
                <div className="flex items-center gap-4">
                  <Badge 
                    className={`${currentStatus.bgColor} ${currentStatus.textColor} border-0 px-3 py-1`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {currentStatus.label}
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1">
                    <ClassificationIcon className="h-3 w-3 mr-1" />
                    {currentClassification.label}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Hash className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Title Number</p>
                  <p className="text-gray-600">{property.titleNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Lot Number</p>
                  <p className="text-gray-600">{property.lotNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Location</p>
                  <p className="text-gray-600">{property.location}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-6">
            {!isEditing ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View External
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Property
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Property
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Info Card Component
  const InfoCard = ({ 
    title, 
    description,
    icon: Icon, 
    children,
    className = ""
  }: { 
    title: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }>; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm text-gray-500 mt-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  // Enhanced Field Row Component
  const FieldRow = ({ 
    label, 
    value, 
  }: { 
    label: string; 
    value: string | React.ReactNode;
    icon?: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-sm text-gray-900 text-right flex-1 ml-4">
        {value}
      </div>
    </div>
  );

  return (
    <div className="max-w-full mx-auto min-h-screen">
      <PropertyHeader />

      <Tabs defaultValue="overview" className="space-y-2">
        <div className="rounded-xl">
          <TabsList className="w-full space-x-4">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Eye className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="documents" 
              className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <FileText className="h-4 w-4" />
              Documents ({property.documents.length})
              {property._count.documents > 0 && (
                <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 text-xs px-2 py-0">
                  {property._count.documents}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <Activity className="h-4 w-4" />
              Activity History
              {totalActivityCount > 0 && (
                <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 text-xs px-2 py-0">
                  {totalActivityCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="tax" 
              className="flex items-center gap-2 px-6 py-3 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <DollarSign className="h-4 w-4" />
              Real Property Tax ({property.rptRecords.length})
             
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-8">
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Basic Information - Edit Mode */}
                  <InfoCard 
                    title="Basic Information" 
                    description="Core property details and identification"
                    icon={Info}
                  >
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="propertyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Property Name</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={isLoading}
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter property name"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Optional display name for this property
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="titleNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">
                                Title Number <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={isLoading}
                                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="e.g., TCT-12345"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lotNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">
                                Lot Number <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  {...field} 
                                  disabled={isLoading}
                                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="e.g., LOT-001"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Location <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={isLoading}
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Complete address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="area"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-gray-700">
                                Area (sqm) <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  disabled={isLoading}
                                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="0.00"
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
                              <FormLabel className="text-sm font-medium text-gray-700">
                                Classification <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                                disabled={isLoading}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Object.entries(classificationConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        <config.icon className="h-4 w-4" />
                                        {config.label}
                                      </div>
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
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Status <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={isLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-2 h-2 rounded-full ${config.color}`} />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      </div>

                      

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                rows={4} 
                                disabled={isLoading}
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                                placeholder="Additional property details..."
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Optional detailed description of the property
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </InfoCard>

                  {/* Ownership & Custody - Edit Mode */}
                  <InfoCard 
                    title="Ownership & Custody" 
                    description="Property ownership and custodial information"
                    icon={Users}
                  >
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="registeredOwner"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Registered Owner <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                disabled={isLoading}
                                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Full name of registered owner"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

<div className="mt-6 space-y-6">
  {/* Row with Custodian & Bank Selects */}
  <div className="flex gap-2">
    <div className="flex-1">
      <FormField
        control={form.control}
        name="custodianId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">
              Custodian <span className="text-red-500">*</span>
            </FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select custodian" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {availableCustodians.map((custodian) => (
                  <SelectItem key={custodian.id} value={custodian.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                          {custodian.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {custodian.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>

    <div className="flex-1">
      <FormField
        control={form.control}
        name="bankId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700">
              Associated Bank
            </FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value || ''}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select bank (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="no-bank">
                  <span className="text-gray-500">No Bank Selected</span>
                </SelectItem>
                {availableBanks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">{bank.name}</div>
                        <div className="text-xs text-gray-500">{bank.branchName}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  </div>

  {/* Borrower/Mortgagor Input — full width */}
  <div>
    <FormField
      control={form.control}
      name="borrowerMortgagor"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-medium text-gray-700">
            Borrower/Mortgagor
          </FormLabel>
          <FormControl>
            <Input 
              {...field} 
              disabled={isLoading}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 w-full"
              placeholder="Name of borrower or mortgagor"
            />
          </FormControl>
          <FormDescription className="text-xs text-gray-500">
            Optional if property has mortgage
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </div>
</div>


                    <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="encumbranceMortgage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Encumbrance/Mortgage Details</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4} 
                              disabled={isLoading}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                              placeholder="Details about any encumbrances or mortgages..."
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Include mortgage details, liens, or other encumbrances
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='space-y-2 mt-4'>                     
                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Remarks</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={4} 
                              disabled={isLoading}
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                              placeholder="Additional notes or comments..."
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Any additional notes or special considerations
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  </InfoCard>
                </div>

 
              </form>
            </Form>
          ) : (
            /* View Mode */
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information - View Mode */}
                <InfoCard 
                  title="Basic Information" 
                  description="Core property details and identification"
                  icon={Info}
                >
                  <div className="space-y-1">
                    <FieldRow label="Title Number" value={property.titleNumber} icon={Hash} />
                    <FieldRow label="Lot Number" value={property.lotNumber} icon={Building2} />
                    <FieldRow label="Location" value={property.location} icon={MapPin} />
                    <FieldRow 
                      label="Area" 
                      value={`${formatArea(Number(property.area))} sqm`}
                      icon={TrendingUp}
                    />
                    <FieldRow 
                      label="Classification" 
                      value={
                        <Badge variant="outline" className="font-medium">
                          <ClassificationIcon className="h-3 w-3 mr-1" />
                          {currentClassification.label}
                        </Badge>
                      }
                      icon={currentClassification.icon}
                    />
                  </div>
                  
                  {property.description && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Description
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg">
                          {property.description}
                        </p>
                      </div>
                    </>
                  )}
                </InfoCard>

                {/* Ownership Information - View Mode */}
                <InfoCard 
                  title="Ownership & Custody" 
                  description="Property ownership and custodial information"
                  icon={Users}
                >
                  <div className="space-y-1">
                    <FieldRow 
                      label="Registered Owner" 
                      value={property.registeredOwner} 
                      icon={User} 
                    />
                    <FieldRow 
                      label="Custodian" 
                      value={
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                              {getUserInitials(property.custodian)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{getUserName(property.custodian)}</span>
                        </div>
                      }
                      icon={Shield}
                    />
                    <FieldRow 
                      label="Borrower/Mortgagor" 
                      value={property.borrowerMortgagor || (
                        <span className="text-gray-400 italic">Not specified</span>
                      )}
                      icon={CreditCard}
                    />
                    <FieldRow 
                      label="Associated Bank" 
                      value={property.bank ? (
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-blue-600" />
                          <div className="text-right">
                            <div className="font-medium">{property.bank.name}</div>
                            <div className="text-xs text-gray-500">{property.bank.branchName}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No bank associated</span>
                      )}
                      icon={Landmark}
                    />
                    <FieldRow 
                      label="Tax Declaration" 
                      value={property.taxDeclaration || (
                        <span className="text-gray-400 italic">Not specified</span>
                      )}
                      icon={FileText}
                    />
                  </div>
                </InfoCard>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-xl">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{property._count.documents}</p>
                        <p className="text-sm text-gray-500">Documents</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-50 rounded-xl">
                        <Activity className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{totalActivityCount}</p>
                        <p className="text-sm text-gray-500">Activities</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-50 rounded-xl">
                        <DollarSign className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{property._count.rptRecords}</p>
                        <p className="text-sm text-gray-500">Tax Records</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-50 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{formatArea(Number(property.area))}</p>
                        <p className="text-sm text-gray-500">Sq Meters</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Information - View Mode */}
              {(property.encumbranceMortgage || property.remarks) && (
                <InfoCard 
                  title="Additional Information" 
                  description="Mortgage details and additional notes"
                  icon={FileText}
                >
                  <div className="space-y-6">
                    {property.encumbranceMortgage && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          Encumbrance/Mortgage Details
                        </h4>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {property.encumbranceMortgage}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {property.remarks && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          Remarks
                        </h4>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {property.remarks}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </InfoCard>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <InfoCard 
            title="Property Documents" 
            description="All documents related to this property"
            icon={FileText}
          >
            {property.documents.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Archive className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No documents have been uploaded for this property yet. 
                  Documents will appear here once they are added.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {property.documents.map((doc, index) => {
                  const DocIcon = getDocumentIcon(doc.mimeType);
                  return (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <DocIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.fileName}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {doc.mimeType}
                            </span>
                            <span className="text-xs text-gray-500">
                              Uploaded {format(new Date(doc.createdAt), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </InfoCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          {property.approvalRequests.length === 0 && 
           property.releases.length === 0 && 
           property.turnovers.length === 0 && 
           property.returns.length === 0 ? (
            <InfoCard 
              title="Activity History" 
              description="Track all activities and changes for this property"
              icon={Activity}
            >
              <div className="text-center py-16">
                <div className="p-4 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Activity className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activity history</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No activities have been recorded for this property yet. 
                  Activities will appear here as they occur.
                </p>
              </div>
            </InfoCard>
          ) : (
            <div className="space-y-6">
              {/* Approval Requests */}
              {property.approvalRequests.length > 0 && (
                <InfoCard 
                  title="Approval Requests" 
                  description="All approval requests for this property"
                  icon={CheckCircle}
                >
                  <div className="space-y-4">
                    {property.approvalRequests.map((approval) => (
                      <div 
                        key={approval.id} 
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {approval.entityType.replace(/_/g, ' ')} Request
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                Requested by {getUserName(approval.requestedBy)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(approval.createdAt), 'MMM dd, yyyy HH:mm')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            approval.status === 'APPROVED' 
                              ? 'default' 
                              : approval.status === 'REJECTED' 
                              ? 'destructive' 
                              : 'secondary'
                          }
                          className="flex items-center gap-1"
                        >
                          {approval.status === 'APPROVED' && <CheckCircle className="h-3 w-3" />}
                          {approval.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                          {approval.status === 'PENDING' && <Clock className="h-3 w-3" />}
                          {approval.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </InfoCard>
              )}

              {/* Add similar sections for releases, turnovers, returns */}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tax" className="space-y-6">
          <InfoCard 
            title="Real Property Tax Records" 
            description="Tax assessment and payment records for this property"
            icon={DollarSign}
          >
            {property.rptRecords.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tax records found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No tax records have been added for this property yet. 
                  Tax records will appear here once they are created.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-900">Tax Year</TableHead>
                      <TableHead className="font-semibold text-gray-900">Assessed Value</TableHead>
                      <TableHead className="font-semibold text-gray-900">Amount Due</TableHead>
                      <TableHead className="font-semibold text-gray-900">Payment Schedule</TableHead>
                      <TableHead className="font-semibold text-gray-900">Due Date</TableHead>
                      <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {property.rptRecords.map((rpt) => (
                      <TableRow key={rpt.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {rpt.taxYear}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(Number(rpt.assessedValue))}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(Number(rpt.totalAmountDue))}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {rpt.paymentSchedule.replace(/_/g, ' ').toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {format(new Date(rpt.dueDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              rpt.status === 'FULLY_PAID' 
                                ? 'default' 
                                : rpt.status === 'PARTIALLY_PAID' 
                                ? 'secondary' 
                                : 'destructive'
                            }
                            className="flex items-center gap-1 w-fit"
                          >
                            {rpt.status === 'FULLY_PAID' && <CheckCircle className="h-3 w-3" />}
                            {rpt.status === 'PARTIALLY_PAID' && <Clock className="h-3 w-3" />}
                            {rpt.status === 'UNPAID' && <AlertTriangle className="h-3 w-3" />}
                            {rpt.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </InfoCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}