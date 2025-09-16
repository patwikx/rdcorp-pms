// components/roles/role-member-management.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  User,
  Building2,
  Calendar,
  Mail,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import type { 
  RoleDetails,
} from '@/types/role-types';

interface RoleMemberManagementProps {
  businessUnitId: string;
  role: RoleDetails;
}

export function RoleMemberManagement({
  businessUnitId,
  role,
}: RoleMemberManagementProps) {
  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 font-medium flex items-center">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200 font-medium flex items-center">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null }) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  const activeMembers = role.businessUnitMembers.filter(member => member.isActive);
  const inactiveMembers = role.businessUnitMembers.filter(member => !member.isActive);

  return (
    <div className="space-y-6">
      {/* Members Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Role Members ({role.businessUnitMembers.length} total, {activeMembers.length} active)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {role.businessUnitMembers.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Members</h3>
              <p className="text-muted-foreground mb-4">
                No users are currently assigned to this role.
              </p>
              <Button asChild>
                <Link href={`/${businessUnitId}/users/assignments/create`}>
                  <Users className="h-4 w-4 mr-2" />
                  Assign Users
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Members */}
              {activeMembers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Active Members ({activeMembers.length})
                  </h4>
                  <div className="space-y-3">
                    {activeMembers.map((member) => (
                      <Card key={member.id} className="border border-green-200 bg-green-50/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <div>
                                  <div className="font-semibold">{getUserName(member.user)}</div>
                                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span>{member.user.email}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4 text-green-600" />
                                <div>
                                  <div className="font-medium text-sm">{member.businessUnit.name}</div>
                                  {member.businessUnit.description && (
                                    <div className="text-xs text-muted-foreground">{member.businessUnit.description}</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div>{getStatusBadge(member.isActive)}</div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Joined {format(new Date(member.joinedAt), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/${businessUnitId}/users/${member.user.id}`}>
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Inactive Members */}
              {inactiveMembers.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-gray-600" />
                    Inactive Members ({inactiveMembers.length})
                  </h4>
                  <div className="space-y-3">
                    {inactiveMembers.map((member) => (
                      <Card key={member.id} className="border border-gray-200 bg-gray-50/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-gray-600" />
                                <div>
                                  <div className="font-semibold text-gray-700">{getUserName(member.user)}</div>
                                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span>{member.user.email}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4 text-gray-600" />
                                <div>
                                  <div className="font-medium text-sm text-gray-700">{member.businessUnit.name}</div>
                                  {member.businessUnit.description && (
                                    <div className="text-xs text-muted-foreground">{member.businessUnit.description}</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div>{getStatusBadge(member.isActive)}</div>
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>Joined {format(new Date(member.joinedAt), 'MMM dd, yyyy')}</span>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                              >
                                <Link href={`/${businessUnitId}/users/${member.user.id}`}>
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}