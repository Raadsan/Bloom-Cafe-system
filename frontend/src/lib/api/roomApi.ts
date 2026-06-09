import api from './axios';

export interface Room {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  _count?: { table: number };
  table?: { id: number; number: number; name?: string; status: string }[];
}

export interface CreateRoomPayload {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateRoomPayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const roomApi = {
  getAllRooms: async (): Promise<Room[]> => {
    const res = await api.get('/rooms/all');
    return res.data.data || [];
  },

  getRoomById: async (id: number): Promise<Room> => {
    const res = await api.get(`/rooms/${id}`);
    return res.data.data;
  },

  createRoom: async (payload: CreateRoomPayload): Promise<Room> => {
    const res = await api.post('/rooms', payload);
    return res.data.data;
  },

  updateRoom: async (id: number, payload: UpdateRoomPayload): Promise<Room> => {
    const res = await api.patch(`/rooms/${id}`, payload);
    return res.data.data;
  },

  deleteRoom: async (id: number): Promise<void> => {
    await api.delete(`/rooms/${id}`);
  },
};
