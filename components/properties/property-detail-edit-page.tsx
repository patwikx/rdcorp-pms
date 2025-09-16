// components/properties/property-detail-edit-page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PropertyEditForm } from './property-edit-form';
import { updateProperty } from '@/lib/actions/property-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  FileText, 
  Activity,
  Calendar,
  CheckCircle,
  MapPin,
  User,
  Hash,
  Ruler,
} from 'lucide-react';
import { format } from 'date-fns';
import type { 
  PropertyDetails,
  PropertyFormData,
  BankList,
  UserList,
} from '@/types/property-types';
import { PropertyClassification, PropertyStatus } from '@prisma/client';

interface PropertyDetailEditPageProps {
  businessUnitId: string;
  property: PropertyDetails;
  availableBanks: BankList;
  availableCustodians: UserList;
}

export function PropertyDetailEditPage({
  businessUnitId,
  property,
  availableBanks,
  availableCustodians,
}: PropertyDetailEditPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: PropertyFormData) => {
    setIsLoading(true);
    try {
      const result = await updateProperty(businessUnitId, property.id, data);
      
      if (result.success) {
        toast.success('Property updated successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update property');
      }
    } catch (error) {
      console.error('Error updating property:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${businessUnitId}/properties`);
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
      BANK_CUSTODY: { className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-indigo-200' },
    };

    const config = variants[status];
    return (
      <Badge className={`${config.className} font-medium text-xs`}>
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

  // Transform property data for the form
  const initialData: PropertyFormData = {
    propertyName: property.propertyName,
    titleNumber: property.titleNumber,
    lotNumber: property.lotNumber,
    location: property.location,
    area: property.area,
    description: property.description || '',
    registeredOwner: property.registeredOwner,
    encumbranceMortgage: property.encumbranceMortgage || '',
    borrowerMortgagor: property.borrowerMortgagor || '',
    bankId: property.bankId || '',
    custodianId: property.custodianId,
    propertyClassification: property.propertyClassification,
    status: property.status,
    currentLocation: property.currentLocation,
    taxDeclaration: property.taxDeclaration || '',
    remarks: property.remarks || '',
  };

  return (
    <div className="space-y-6">
      {/* Property Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Property Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Property Name</div>
              <div className="text-lg font-semibold">{property.propertyName}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Title Number</div>
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{property.titleNumber}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Status & Classification</div>
              <div className="space-y-1">
                <div>{getStatusBadge(property.status)}</div>
                <div>{getClassificationBadge(property.propertyClassification)}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Area & Location</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-sm">
                  <Ruler className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{formatArea(property.area)} sqm</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{property.location}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Registered Owner</div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="text-sm">{property.registeredOwner}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Created</div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{format(new Date(property.createdAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Last Updated</div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{format(new Date(property.updatedAt), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Interface */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Property Details
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({property._count.documents})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <PropertyEditForm
            property={property}
            availableBanks={availableBanks}
            availableCustodians={availableCustodians}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            initialData={initialData}
            isEditMode={true}
          />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-600" />
                Property Documents ({property._count.documents})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {property.documents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Documents</h3>
                  <p className="text-muted-foreground">
                    No documents have been uploaded for this property yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {property.documents.map((document) => (
                    <div key={document.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-semibold">{document.originalName}</div>
                            <div className="text-sm text-muted-foreground">
                              {document.documentType.replace('_', ' ')} • {(document.fileSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Uploaded by {document.createdBy.firstName} {document.createdBy.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(document.createdAt), 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Property Activity Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{property._count.releases}</div>
                  <div className="text-sm text-muted-foreground">Releases</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{property._count.turnovers}</div>
                  <div className="text-sm text-muted-foreground">Turnovers</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{property._count.returns}</div>
                  <div className="text-sm text-muted-foreground">Returns</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{property._count.movements}</div>
                  <div className="text-sm text-muted-foreground">Movements</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Created on {format(new Date(property.createdAt), 'MMMM dd, yyyy')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">Last updated {format(new Date(property.updatedAt), 'MMMM dd, yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}