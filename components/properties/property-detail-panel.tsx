// components/properties/property-detail-panel.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  X,
  MapPin,
  User,
  FileText,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  Send,
  ArrowLeftRight,
  RotateCcw,
  Download,
  Eye,
} from 'lucide-react';
import type { PropertyDetails } from '@/types/property-types';
import { PropertyClassification, PropertyStatus } from '@prisma/client';
import { format } from 'date-fns';

interface PropertyDetailPanelProps {
  property: PropertyDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (propertyId: string) => void;
  canEdit: boolean;
}

export function PropertyDetailPanel({
  property,
  isOpen,
  onClose,
  onEdit,
  canEdit,
}: PropertyDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!property) {
    return null;
  }

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

  const getUserName = (user: { firstName: string | null; lastName: string | null } | null) => {
    if (!user) return 'Unknown User';
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl">
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-xl">
                {property.titleNumber}
              </SheetTitle>
              <SheetDescription className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{property.location}</span>
              </SheetDescription>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(property.id)}
                >
                  Edit Property
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {getStatusBadge(property.status)}
            {getClassificationBadge(property.propertyClassification)}
          </div>
        </SheetHeader>

        <Separator className="my-6" />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">
              Documents
              {property._count.documents > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {property._count.documents}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="workflow">
              Workflow
              {(property._count.approvals + property._count.releases + property._count.turnovers + property._count.returns) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {property._count.approvals + property._count.releases + property._count.turnovers + property._count.returns}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="tax">
              Tax Records
              {property._count.rptRecords > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {property._count.rptRecords}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)] mt-6">
            <TabsContent value="overview" className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Title Number</label>
                      <p className="text-sm font-mono">{property.titleNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Lot Number</label>
                      <p className="text-sm">{property.lotNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Area</label>
                      <p className="text-sm">{formatArea(Number(property.area))} sqm</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tax Declaration</label>
                      <p className="text-sm">{property.taxDeclaration || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-sm">{property.location}</p>
                  </div>

                  {property.description && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Description</label>
                      <p className="text-sm">{property.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ownership Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Ownership Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Registered Owner</label>
                    <p className="text-sm">{property.registeredOwner}</p>
                  </div>

                  {property.encumbranceMortgage && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Encumbrance/Mortgage</label>
                      <p className="text-sm">{property.encumbranceMortgage}</p>
                    </div>
                  )}

                  {property.borrowerMortgagor && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Borrower/Mortgagor</label>
                      <p className="text-sm">{property.borrowerMortgagor}</p>
                    </div>
                  )}

                  {property.bank && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Bank</label>
                      <p className="text-sm">{property.bank}</p>
                    </div>
                  )}

                  {property.custodyOriginalTitle && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Custody of Original Title</label>
                      <p className="text-sm">{property.custodyOriginalTitle}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>System Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Created By</label>
                      <p className="text-sm">{getUserName(property.createdBy)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(property.createdAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="text-sm">{property.updatedBy ? getUserName(property.updatedBy) : 'Never updated'}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(property.updatedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Business Unit</label>
                    <p className="text-sm">{property.businessUnit.name}</p>
                  </div>

                  {property.remarks && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                      <p className="text-sm">{property.remarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-4">
              {property.documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No documents</h3>
                  <p className="text-sm text-muted-foreground">
                    No documents have been uploaded for this property yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {property.documents.map((document) => (
                    <Card key={document.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{document.originalName}</p>
                              <p className="text-xs text-muted-foreground">
                                {document.documentType.replace('_', ' ')} • 
                                {(document.fileSize / 1024 / 1024).toFixed(2)} MB • 
                                Uploaded by {getUserName(document.createdBy)} on {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="workflow" className="space-y-4">
              {/* Approvals */}
              {property.approvals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5" />
                      <span>Approvals</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {property.approvals.map((approval) => (
                      <div key={approval.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm font-medium">
                            {getUserName(approval.approver)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {approval.approvedAt ? 
                              format(new Date(approval.approvedAt), 'MMM dd, yyyy HH:mm') : 
                              format(new Date(approval.createdAt), 'MMM dd, yyyy HH:mm')
                            }
                          </p>
                          {approval.comments && (
                            <p className="text-xs text-muted-foreground mt-1">{approval.comments}</p>
                          )}
                        </div>
                        <Badge variant={approval.status === 'APPROVED' ? 'default' : 
                                      approval.status === 'REJECTED' ? 'destructive' : 'secondary'}>
                          {approval.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Releases */}
              {property.releases.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Send className="h-5 w-5" />
                      <span>Releases</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {property.releases.map((release) => (
                      <div key={release.id} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-muted-foreground">Released By</label>
                            <p>{release.releasedBy ? getUserName(release.releasedBy) : 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Date Released</label>
                            <p>{release.dateReleased ? format(new Date(release.dateReleased), 'MMM dd, yyyy') : 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Approved By</label>
                            <p>{release.approvedBy ? getUserName(release.approvedBy) : 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Received By</label>
                            <p>{release.receivedBy ? getUserName(release.receivedBy) : 'Not specified'}</p>
                          </div>
                        </div>
                        {release.purposeOfRelease && (
                          <div className="mt-2">
                            <label className="font-medium text-muted-foreground text-sm">Purpose</label>
                            <p className="text-sm">{release.purposeOfRelease}</p>
                          </div>
                        )}
                        {release.transmittalNumber && (
                          <div className="mt-2">
                            <label className="font-medium text-muted-foreground text-sm">Transmittal Number</label>
                            <p className="text-sm font-mono">{release.transmittalNumber}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Turnovers */}
              {property.turnovers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <ArrowLeftRight className="h-5 w-5" />
                      <span>Turnovers</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {property.turnovers.map((turnover) => (
                      <div key={turnover.id} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-muted-foreground">Turned Over By</label>
                            <p>{turnover.turnedOverBy ? getUserName(turnover.turnedOverBy) : 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Date</label>
                            <p>{turnover.turnedOverDate ? format(new Date(turnover.turnedOverDate), 'MMM dd, yyyy') : 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Received By</label>
                            <p>{turnover.receivedBy ? getUserName(turnover.receivedBy) : 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Returns */}
              {property.returns.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <RotateCcw className="h-5 w-5" />
                      <span>Returns</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {property.returns.map((returnRecord) => (
                      <div key={returnRecord.id} className="p-3 border rounded-lg">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-muted-foreground">Returned By</label>
                            <p>{returnRecord.returnedBy ? getUserName(returnRecord.returnedBy) : 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Date Returned</label>
                            <p>{returnRecord.dateReturned ? format(new Date(returnRecord.dateReturned), 'MMM dd, yyyy') : 'Not specified'}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Received By</label>
                            <p>{returnRecord.receivedBy ? getUserName(returnRecord.receivedBy) : 'Not specified'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {(property.approvals.length === 0 && property.releases.length === 0 && 
                property.turnovers.length === 0 && property.returns.length === 0) && (
                <div className="text-center py-8">
                  <ArrowLeftRight className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No workflow history</h3>
                  <p className="text-sm text-muted-foreground">
                    No approvals, releases, turnovers, or returns have been recorded for this property.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tax" className="space-y-4">
              {property.rptRecords.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No tax records</h3>
                  <p className="text-sm text-muted-foreground">
                    No real property tax records have been added for this property yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {property.rptRecords.map((rpt) => (
                    <Card key={rpt.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">Tax Year {rpt.taxYear}</h4>
                          <Badge variant={rpt.status === 'FULLY_PAID' ? 'default' : 
                                        rpt.status === 'PARTIALLY_PAID' ? 'secondary' : 'destructive'}>
                            {rpt.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <label className="font-medium text-muted-foreground">Assessed Value</label>
                            <p>₱{Number(rpt.assessedValue).toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Total Amount Due</label>
                            <p>₱{Number(rpt.totalAmountDue).toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Payment Schedule</label>
                            <p>{rpt.paymentSchedule.replace('_', ' ')}</p>
                          </div>
                          <div>
                            <label className="font-medium text-muted-foreground">Due Date</label>
                            <p>{format(new Date(rpt.dueDate), 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}