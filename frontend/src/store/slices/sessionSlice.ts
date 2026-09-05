import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types';

interface SessionState {
  user: User | null;
  hydrated: boolean;
}

const initialState: SessionState = { user: null, hydrated: false };

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload;
      state.hydrated = true;
    },
  },
});

export const { setUser } = sessionSlice.actions;
export default sessionSlice.reducer;
