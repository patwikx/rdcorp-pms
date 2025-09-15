// components/properties/property-stats-cards.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingUp, 
  Clock, 
  AlertCircle,
  BarChart3,
  MapPin 
} from 'lucide-react';
import type { PropertyStats } from '@/types/property-types';

interface PropertyStatsCardsProps {
  stats: PropertyStats;
}

export function PropertyStatsCards({ stats }: PropertyStatsCardsProps) {
  const formatArea = (area: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(area);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Properties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.total)}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
            <TrendingUp className="h-3 w-3" />
            <span>{formatNumber(stats.recentlyAdded)} added this month</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Area */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Area</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatArea(stats.totalArea)}</div>
          <p className="text-xs text-muted-foreground">square meters</p>
        </CardContent>
      </Card>

      {/* Active Properties */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(stats.byStatus.ACTIVE)}
          </div>
          <div className="flex items-center space-x-1 mt-2">
            <Badge variant="secondary" className="text-xs">
              {stats.total > 0 ? Math.round((stats.byStatus.ACTIVE / stats.total) * 100) : 0}%
            </Badge>
            <span className="text-xs text-muted-foreground">of total</span>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {formatNumber(stats.pendingApprovals)}
          </div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-2">
            <Clock className="h-3 w-3" />
            <span>Require attention</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}