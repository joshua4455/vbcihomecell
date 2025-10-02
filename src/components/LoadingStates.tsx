import React from 'react';
import { Loader2, Users, Calendar, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Logo } from '@/components/Logo';

// Generic loading spinner
export const LoadingSpinner = ({ size = 'default', className = '' }: { 
  size?: 'sm' | 'default' | 'lg'; 
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  );
};

// Full page loading
export const PageLoading = ({ message = 'Loading...' }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-accent/20">
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="bg-primary/10 p-4 rounded-full">
          <Logo size="lg" className="text-primary animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <LoadingSpinner size="lg" className="mx-auto text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  </div>
);

// Dashboard loading skeleton
export const DashboardLoading = () => (
  <div className="space-y-6 p-6">
    {/* Header skeleton */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Stats cards skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Content area skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

// Form loading skeleton
export const FormLoading = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Table loading skeleton
export const TableLoading = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <div className="space-y-3">
    {/* Table header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8 w-full" />
        ))}
      </div>
    ))}
  </div>
);

// Meeting card loading
export const MeetingCardLoading = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div className="space-y-1">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-4 rounded" />
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </CardContent>
  </Card>
);

// List loading with icons
export const ListLoading = ({ 
  items = 5, 
  showIcon = true,
  iconType = 'users' 
}: { 
  items?: number; 
  showIcon?: boolean;
  iconType?: 'users' | 'calendar' | 'file';
}) => {
  const getIcon = () => {
    switch (iconType) {
      case 'users': return Users;
      case 'calendar': return Calendar;
      case 'file': return FileText;
      default: return Users;
    }
  };

  const Icon = getIcon();

  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
          {showIcon && <Icon className="h-5 w-5 text-muted-foreground" />}
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-full max-w-xs" />
            <Skeleton className="h-3 w-full max-w-sm" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
};

// Button loading state
export const ButtonLoading = ({ 
  children, 
  isLoading, 
  loadingText = 'Loading...',
  ...props 
}: {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  [key: string]: any;
}) => (
  <button {...props} disabled={isLoading || props.disabled}>
    {isLoading ? (
      <>
        <LoadingSpinner size="sm" className="mr-2" />
        {loadingText}
      </>
    ) : (
      children
    )}
  </button>
);
