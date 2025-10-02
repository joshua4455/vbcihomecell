import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  zoneService, 
  areaService, 
  cellService, 
  memberService, 
  meetingService, 
  alertService,
  userService 
} from '@/services/supabaseService';
import type { Zone, Area, Cell, Member, Meeting, Alert, User } from '@/lib/supabase';

interface DataContextType {
  // Data
  zones: Zone[];
  areas: Area[];
  cells: Cell[];
  members: Member[];
  meetings: Meeting[];
  alerts: Alert[];
  users: User[];
  isLoading: boolean;
  
  // Zone Actions
  addZone: (zone: Omit<Zone, 'id' | 'created_at' | 'updated_at'>) => Promise<Zone>;
  updateZone: (id: string, updates: Partial<Zone>) => Promise<Zone>;
  deleteZone: (id: string) => Promise<void>;
  
  // Area Actions
  addArea: (area: Omit<Area, 'id' | 'created_at' | 'updated_at'>) => Promise<Area>;
  updateArea: (id: string, updates: Partial<Area>) => Promise<Area>;
  deleteArea: (id: string) => Promise<void>;
  
  // Cell Actions
  addCell: (cell: Omit<Cell, 'id' | 'created_at' | 'updated_at'>) => Promise<Cell>;
  updateCell: (id: string, updates: Partial<Cell>) => Promise<Cell>;
  deleteCell: (id: string) => Promise<void>;
  
  // Member Actions
  addMember: (member: Omit<Member, 'id' | 'created_at' | 'updated_at'>) => Promise<Member>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<Member>;
  deleteMember: (id: string) => Promise<void>;
  
  // Meeting Actions
  addMeeting: (meeting: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>) => Promise<Meeting>;
  updateMeeting: (id: string, updates: Partial<Meeting>) => Promise<Meeting>;
  deleteMeeting: (id: string) => Promise<void>;
  
  // Alert Actions
  addAlert: (alert: Omit<Alert, 'id' | 'created_at' | 'updated_at'>) => Promise<Alert>;
  updateAlert: (id: string, updates: Partial<Alert>) => Promise<Alert>;
  deleteAlert: (id: string) => Promise<void>;
  
  // User Actions
  addUser: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => Promise<User>;
  addUserWithId: (id: string, user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => Promise<User>;
  updateUser: (id: string, updates: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  getUserById: (id: string) => User | undefined;
  getUsersByRole: (role: string) => User[];
  
  // Queries
  getZoneById: (id: string) => Zone | undefined;
  getAreaById: (id: string) => Area | undefined;
  getCellById: (id: string) => Cell | undefined;
  getMeetingsByCell: (cellId: string) => Meeting[];
  getMeetingsByArea: (areaId: string) => Meeting[];
  getMeetingsByZone: (zoneId: string) => Meeting[];
  getAlertsByRole: (role: string) => Alert[];
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [cells, setCells] = useState<Cell[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Prevent concurrent loads and network storms
  const [isLoadingInFlight, setIsLoadingInFlight] = useState(false);

  // Load initial data
  const loadData = async () => {
    if (isLoadingInFlight) return; // coalesce multiple calls
    setIsLoadingInFlight(true);
    try {
      setIsLoading(true);
      const [zonesData, areasData, cellsData, membersData, meetingsData, alertsData, usersData] = await Promise.all([
        zoneService.getZones(),
        areaService.getAreas(),
        cellService.getCells(),
        memberService.getMembers(),
        meetingService.getMeetings(),
        alertService.getAlerts(),
        userService.getUsers()
      ]);
      setZones(zonesData);
      setAreas(areasData);
      setCells(cellsData);
      setMembers(membersData);
      setMeetings(meetingsData);
      setAlerts(alertsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingInFlight(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Also refresh data whenever the auth session changes (e.g., user switches accounts)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Coalesce: loadData already guards against concurrent loads
      loadData();
    });
    return () => subscription.unsubscribe();
  }, []);

  // Zone Actions
  const addZone = async (zoneData: Omit<Zone, 'id' | 'created_at' | 'updated_at'>): Promise<Zone> => {
    const newZone = await zoneService.createZone(zoneData);
    setZones(prev => [...prev, newZone]);
    return newZone;
  };

  const updateZone = async (id: string, updates: Partial<Zone>): Promise<Zone> => {
    const updatedZone = await zoneService.updateZone(id, updates);
    setZones(prev => prev.map(zone => zone.id === id ? updatedZone : zone));
    return updatedZone;
  };

  const deleteZone = async (id: string): Promise<void> => {
    await zoneService.deleteZone(id);
    // Zone deletion can cascade (Edge Function) and remove areas, cells, users, meetings.
    // Reload everything to keep UI in sync with DB.
    await loadData();
  };

  // Area Actions
  const addArea = async (areaData: Omit<Area, 'id' | 'created_at' | 'updated_at'>): Promise<Area> => {
    const newArea = await areaService.createArea(areaData);
    setAreas(prev => [...prev, newArea]);
    return newArea;
  };

  const updateArea = async (id: string, updates: Partial<Area>): Promise<Area> => {
    const updatedArea = await areaService.updateArea(id, updates);
    setAreas(prev => prev.map(area => area.id === id ? updatedArea : area));
    return updatedArea;
  };

  const deleteArea = async (id: string): Promise<void> => {
    await areaService.deleteArea(id);
    setAreas(prev => prev.filter(area => area.id !== id));
  };

  // Cell Actions
  const addCell = async (cellData: Omit<Cell, 'id' | 'created_at' | 'updated_at'>): Promise<Cell> => {
    const newCell = await cellService.createCell(cellData);
    setCells(prev => [...prev, newCell]);
    return newCell;
  };

  const updateCell = async (id: string, updates: Partial<Cell>): Promise<Cell> => {
    const updatedCell = await cellService.updateCell(id, updates);
    setCells(prev => prev.map(cell => cell.id === id ? updatedCell : cell));
    return updatedCell;
  };

  const deleteCell = async (id: string): Promise<void> => {
    await cellService.deleteCell(id);
    setCells(prev => prev.filter(cell => cell.id !== id));
  };

  // Member Actions
  const addMember = async (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> => {
    const newMember = await memberService.createMember(memberData);
    setMembers(prev => [...prev, newMember]);
    return newMember;
  };

  const updateMember = async (id: string, updates: Partial<Member>): Promise<Member> => {
    const updatedMember = await memberService.updateMember(id, updates);
    setMembers(prev => prev.map(member => member.id === id ? updatedMember : member));
    return updatedMember;
  };

  const deleteMember = async (id: string): Promise<void> => {
    await memberService.deleteMember(id);
    setMembers(prev => prev.filter(member => member.id !== id));
  };

  // Meeting Actions
  const addMeeting = async (meetingData: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>): Promise<Meeting> => {
    const newMeeting = await meetingService.createMeeting(meetingData);
    setMeetings(prev => [...prev, newMeeting]);
    return newMeeting;
  };

  const updateMeeting = async (id: string, updates: Partial<Meeting>): Promise<Meeting> => {
    const updatedMeeting = await meetingService.updateMeeting(id, updates);
    setMeetings(prev => prev.map(meeting => meeting.id === id ? updatedMeeting : meeting));
    return updatedMeeting;
  };

  const deleteMeeting = async (id: string): Promise<void> => {
    await meetingService.deleteMeeting(id);
    setMeetings(prev => prev.filter(meeting => meeting.id !== id));
  };

  // Alert Actions
  const addAlert = async (alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at'>): Promise<Alert> => {
    const newAlert = await alertService.createAlert(alertData);
    setAlerts(prev => [...prev, newAlert]);
    return newAlert;
  };

  const updateAlert = async (id: string, updates: Partial<Alert>): Promise<Alert> => {
    const updatedAlert = await alertService.updateAlert(id, updates);
    setAlerts(prev => prev.map(alert => alert.id === id ? updatedAlert : alert));
    return updatedAlert;
  };

  const deleteAlert = async (id: string): Promise<void> => {
    await alertService.deleteAlert(id);
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // User Actions
  const addUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
    const newUser = await userService.createUser(userData);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const addUserWithId = async (id: string, userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> => {
    const newUser = await userService.createUserWithId(id, userData);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<User> => {
    const updatedUser = await userService.updateUser(id, updates);
    setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
    return updatedUser;
  };

  const deleteUser = async (id: string): Promise<void> => {
    await userService.deleteUser(id);
    setUsers(prev => prev.filter(user => user.id !== id));
  };

  // Query functions
  const getUserById = (id: string): User | undefined => {
    return users.find(user => user.id === id);
  };

  const getUsersByRole = (role: string): User[] => {
    return users.filter(user => user.role === role);
  };

  const getZoneById = (id: string): Zone | undefined => {
    return zones.find(zone => zone.id === id);
  };

  const getAreaById = (id: string): Area | undefined => {
    return areas.find(area => area.id === id);
  };

  const getCellById = (id: string): Cell | undefined => {
    return cells.find(cell => cell.id === id);
  };

  const getMeetingsByCell = (cellId: string): Meeting[] => {
    return meetings.filter(meeting => meeting.cell_id === cellId);
  };

  const getMeetingsByArea = (areaId: string): Meeting[] => {
    const areaCells = cells.filter(cell => cell.area_id === areaId);
    const cellIds = areaCells.map(cell => cell.id);
    return meetings.filter(meeting => cellIds.includes(meeting.cell_id));
  };

  const getMeetingsByZone = (zoneId: string): Meeting[] => {
    const zoneAreas = areas.filter(area => area.zone_id === zoneId);
    const areaIds = zoneAreas.map(area => area.id);
    const zoneCells = cells.filter(cell => areaIds.includes(cell.area_id));
    const cellIds = zoneCells.map(cell => cell.id);
    return meetings.filter(meeting => cellIds.includes(meeting.cell_id));
  };

  const getAlertsByRole = (role: string): Alert[] => {
    return alerts.filter(alert => 
      alert.target_audience === 'all' || 
      alert.target_audience === role
    );
  };

  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  const value: DataContextType = {
    // Data
    zones,
    areas,
    cells,
    members,
    meetings,
    alerts,
    users,
    isLoading,
    
    // Zone Actions
    addZone,
    updateZone,
    deleteZone,
    
    // Area Actions
    addArea,
    updateArea,
    deleteArea,
    
    // Cell Actions
    addCell,
    updateCell,
    deleteCell,
    
    // Member Actions
    addMember,
    updateMember,
    deleteMember,
    
    // Meeting Actions
    addMeeting,
    updateMeeting,
    deleteMeeting,
    
    // Alert Actions
    addAlert,
    updateAlert,
    deleteAlert,
    
    // User Actions
    addUser,
    addUserWithId,
    updateUser,
    deleteUser,
    getUserById,
    getUsersByRole,
    
    // Queries
    getZoneById,
    getAreaById,
    getCellById,
    getMeetingsByCell,
    getMeetingsByArea,
    getMeetingsByZone,
    getAlertsByRole,
    
    // Refresh
    refreshData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
