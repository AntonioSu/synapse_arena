import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinBattle(topicId: string) {
    if (this.socket) {
      this.socket.emit('join_battle', topicId);
    }
  }

  leaveBattle(topicId: string) {
    if (this.socket) {
      this.socket.emit('leave_battle', topicId);
    }
  }

  onNewComment(callback: (comment: any) => void) {
    if (this.socket) {
      this.socket.on('new_comment', callback);
    }
  }

  onBattleUpdate(callback: (state: any) => void) {
    if (this.socket) {
      this.socket.on('battle_update', callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export const socketService = new SocketService();
