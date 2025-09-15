// app/(dashboard)/[businessUnitId]/dashboard/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Home,
  Plus,
  Eye,
  Calendar,
  User,
  MapPin,
  BarChart3,
  Activity,
  FileText,
  Send,
  ArrowLeftRight,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { PropertyClassification, PropertyStatus } from '@prisma/client';
import Link from 'next/link';

interface DashboardPageProps {
  params: Promise<{ businessUnitId: string }>;
}

interface DashboardStats {
  properties: {
    total: number;
    active: number;
    pending: number;
    released: number;
    totalArea: number;
  };
  workflow: {
    pendingApprovals: number;
    recentReleases: number;
    recentTurnovers: number;
    recentReturns: number;
  };
  users: {
    total: number;
    active: number;
  };
}

interface RecentProperty {
  id: string;
  titleNumber: string;
  location: string;
  area: number;
  registeredOwner: string;
  status: PropertyStatus;
  propertyClassification: PropertyClassification;
  createdAt: Date;
  createdBy: {
    firstName: string | null;
    lastName: string | null;
  };
}

interface RecentActivity {
  id: string;
  type: 'release' | 'turnover' | 'return';
  propertyTitleNumber: string;
  date: Date;
  user: {
    firstName: string | null;
    lastName: string | null;
  };
}

async function getDashboardData(businessUnitId: string): Promise<{
  stats: DashboardStats;
  recentProperties: RecentProperty[];
  recentActivities: RecentActivity[];
}> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get property statistics
  const [
    totalProperties,
    activeProperties,
    pendingProperties,
    releasedProperties,
    totalAreaResult,
    totalUsers,
    activeUsers,
  ] = await Promise.all([
    prisma.property.count({ where: { businessUnitId } }),
    prisma.property.count({ where: { businessUnitId, status: 'ACTIVE' } }),
    prisma.property.count({ where: { businessUnitId, status: 'PENDING' } }),
    prisma.property.count({ where: { businessUnitId, status: 'RELEASED' } }),
    prisma.property.aggregate({
      where: { businessUnitId },
      _sum: { area: true },
    }),
    prisma.user.count({
      where: {
        businessUnitMembers: {
          some: { businessUnitId, isActive: true },
        },
      },
    }),
    prisma.user.count({
      where: {
        isActive: true,
        businessUnitMembers: {
          some: { businessUnitId, isActive: true },
        },
      },
    }),
  ]);

  // Get workflow statistics
  const [recentReleases, recentTurnovers, recentReturns] = await Promise.all([
    prisma.propertyRelease.count({
      where: {
        property: { businessUnitId },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.propertyTurnover.count({
      where: {
        property: { businessUnitId },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.propertyReturn.count({
      where: {
        property: { businessUnitId },
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  // Get recent properties
  const recentProperties = await prisma.property.findMany({
    where: { businessUnitId },
    select: {
      id: true,
      titleNumber: true,
      location: true,
      area: true,
      registeredOwner: true,
      status: true,
      propertyClassification: true,
      createdAt: true,
      createdBy: {
        select: { firstName: true, lastName: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Get recent workflow activities
  const [releases, turnovers, returns] = await Promise.all([
    prisma.propertyRelease.findMany({
      where: {
        property: { businessUnitId },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        createdAt: true,
        property: { select: { titleNumber: true } },
        releasedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.propertyTurnover.findMany({
      where: {
        property: { businessUnitId },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        createdAt: true,
        property: { select: { titleNumber: true } },
        turnedOverBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.propertyReturn.findMany({
      where: {
        property: { businessUnitId },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        createdAt: true,
        property: { select: { titleNumber: true } },
        returnedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
  ]);

  // Combine and sort recent activities
  const recentActivities: RecentActivity[] = [
    ...releases.map(r => ({
      id: r.id,
      type: 'release' as const,
      propertyTitleNumber: r.property.titleNumber,
      date: r.createdAt,
      user: r.releasedBy || { firstName: null, lastName: null },
    })),
    ...turnovers.map(t => ({
      id: t.id,
      type: 'turnover' as const,
      propertyTitleNumber: t.property.titleNumber,
      date: t.createdAt,
      user: t.turnedOverBy || { firstName: null, lastName: null },
    })),
    ...returns.map(r => ({
      id: r.id,
      type: 'return' as const,
      propertyTitleNumber: r.property.titleNumber,
      date: r.createdAt,
      user: r.returnedBy || { firstName: null, lastName: null },
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  const stats: DashboardStats = {
    properties: {
      total: totalProperties,
      active: activeProperties,
      pending: pendingProperties,
      released: releasedProperties,
      totalArea: Number(totalAreaResult._sum.area || 0),
    },
    workflow: {
      pendingApprovals: 0, // This is now a static value since the query was removed
      recentReleases,
      recentTurnovers,
      recentReturns,
    },
    users: {
      total: totalUsers,
      active: activeUsers,
    },
  };

  return {
    stats,
    recentProperties: recentProperties.map(p => ({
      ...p,
      area: Number(p.area),
    })),
    recentActivities,
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/sign-in');
  }

  const { businessUnitId } = await params;

  // Check if user has access to this business unit
  const hasAccess = session.user.assignments?.some(
    assignment => assignment.businessUnitId === businessUnitId
  );

  if (!hasAccess) {
    redirect('/setup?error=unauthorized');
  }

  const { stats, recentProperties, recentActivities } = await getDashboardData(businessUnitId);

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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'release':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'turnover':
        return <ArrowLeftRight className="h-4 w-4 text-green-600" />;
      case 'return':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getUserName = (user: { firstName: string | null; lastName: string | null }) => {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Breadcrumbs */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1">
              <Home className="h-3 w-3" />
              Dashboard
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of your property management operations
          </p>
        </div>
        <Button asChild>
          <Link href={`/${businessUnitId}/properties/create`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Link>
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.properties.totalArea.toLocaleString()} sqm total area
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.properties.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.properties.total > 0 ? Math.round((stats.properties.active / stats.properties.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.workflow.pendingApprovals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.active.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.total.toLocaleString()} total users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Activity Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Releases</CardTitle>
            <Send className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.workflow.recentReleases}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Turnovers</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.workflow.recentTurnovers}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.workflow.recentReturns}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Recent Properties
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${businessUnitId}/properties`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentProperties.length > 0 ? (
              <div className="space-y-4">
                {recentProperties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <Link 
                            href={`/${businessUnitId}/properties/${property.id}`}
                            className="font-semibold text-blue-700 hover:text-blue-800 hover:underline"
                          >
                            {property.titleNumber}
                          </Link>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate max-w-[200px]" title={property.location}>
                              {property.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(property.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-4">
                        <span className="text-muted-foreground">
                          {property.area.toLocaleString()} sqm
                        </span>
                        <span className="text-muted-foreground">
                          {property.registeredOwner}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{format(property.createdAt, 'MMM dd')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Properties</h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding your first property.
                </p>
                <Button asChild>
                  <Link href={`/${businessUnitId}/properties/create`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Recent Activity
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/${businessUnitId}/reports`}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={`${activity.type}-${activity.id}`} className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Property {activity.type} - {activity.propertyTitleNumber}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{getUserName(activity.user)}</span>
                        <span>•</span>
                        <span>{format(activity.date, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                <p className="text-muted-foreground">
                  Property workflow activities will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}