// Core data types for the Priesthood Management Platform

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'cell-leader' | 'area-leader' | 'zone-leader' | 'super-admin';
  zoneId?: string;
  areaId?: string;
  cellId?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface Zone {
  id: string;
  name: string;
  leader: User;
  areas: Area[];
  totalAreas: number;
  totalCells: number;
  totalMembers: number;
  averageAttendance: number;
  totalOfferings: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

export interface Area {
  districtName: string;
  districtleader: string;
  districtPastor: string;
  description: string;
  id: string;
  name: string;
  zoneId: string;
  leader: User;
  cells: Cell[];
  totalMembers: number;
  averageAttendance: number;
  totalOfferings: number;
  // Extended hierarchy/context fields for areas
  zoneName?: string;
  zoneLeaderName?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

export interface Cell {
  id: string;
  name: string;
  areaId: string;
  zoneId?: string;
  leader: User;
  members: CellMember[];
  meetingDay: string;
  meetingTime?: string;
  location?: string;
  description?: string;
  // Extended hierarchy/context fields
  zoneName?: string;
  zoneLeaderName?: string;
  areaName?: string;
  areaLeaderName?: string;
  status: 'active' | 'inactive';
  totalMembers: number;
  averageAttendance: number;
  totalOfferings: number;
  createdAt: Date;
}

export interface CellMember {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  joinDate: Date;
  lastAttendance?: Date;
}

export interface Meeting {
  id: string;
  cellId: string;
  areaId: string;
  zoneId?: string;
  date: Date;
  timeOpened: string;
  timeClosed: string;
  attendees: string[];
  offering: number;
  newVisitors: Visitor[];
  visitsCount: number;
  visitNotes: string;
  status: 'draft' | 'submitted' | 'approved';
  createdAt: Date;
  updatedAt: Date;
}

export interface Visitor {
  id: string;
  name: string;
  contact: string;
  notes: string;
  isConvert: boolean;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  targetAudience: 'all' | 'zone-leaders' | 'area-leaders' | 'cell-leaders';
  priority: 'low' | 'normal' | 'high';
  isActive: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface Report {
  id: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  zoneId?: string;
  areaId?: string;
  cellId?: string;
  period: {
    start: Date;
    end: Date;
  };
  data: {
    totalMeetings: number;
    totalAttendance: number;
    averageAttendance: number;
    totalOfferings: number;
    newVisitors: number;
    newConverts: number;
  };
  generatedAt: Date;
}

export interface ChurchHierarchy {
  zones: Zone[];
  areas: Area[];
  districts: District[];
  regions: Region[];
}

export interface District {
  id: string;
  name: string;
  areas: Area[];
  leader: User;
  pastor: User;
}

export interface Region {
  id: string;
  name: string;
  districts: District[];
  regionalHead: User;
}
