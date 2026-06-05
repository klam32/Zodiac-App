import datetime
from fastapi import WebSocket
from typing import Dict, Set

class ConnectionManager:
    def __init__(self):
        # Map user_id (int) to a set of WebSocket connections
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        # Set of connected admin WebSockets
        self.admin_connections: Set[WebSocket] = set()
        # Track last activity (heartbeat) of admin websockets
        self.last_admin_activity: Dict[WebSocket, datetime.datetime] = {}

    async def connect_user(self, user_id: int, websocket: WebSocket):
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(websocket)
        print(f"[WS] User {user_id} connected. Active user connections: {len(self.user_connections)}")

    def disconnect_user(self, user_id: int, websocket: WebSocket):
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(websocket)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        print(f"[WS] User {user_id} disconnected. Active user connections: {len(self.user_connections)}")

    async def connect_admin(self, websocket: WebSocket):
        self.admin_connections.add(websocket)
        self.last_admin_activity[websocket] = datetime.datetime.now()
        print(f"[WS] Admin connected. Active admin connections: {len(self.admin_connections)}")
        # Notify users that admin is now online
        await self.broadcast_admin_status()

    async def disconnect_admin(self, websocket: WebSocket):
        self.admin_connections.discard(websocket)
        self.last_admin_activity.pop(websocket, None)
        print(f"[WS] Admin disconnected. Active admin connections: {len(self.admin_connections)}")
        # Notify users of new admin status (could be offline now)
        await self.broadcast_admin_status()

    def update_admin_activity(self, websocket: WebSocket):
        self.last_admin_activity[websocket] = datetime.datetime.now()

    def is_admin_online(self) -> bool:
        from starlette.websockets import WebSocketState
        now = datetime.datetime.now()
        active_admins = []
        for connection in list(self.admin_connections):
            # Check connection state
            is_connected = (connection.client_state == WebSocketState.CONNECTED and 
                            connection.application_state == WebSocketState.CONNECTED)
            
            # Check last active time (must have sent a heartbeat within past 20 seconds)
            last_active = self.last_admin_activity.get(connection)
            is_active = last_active and (now - last_active).total_seconds() < 20
            
            if is_connected and is_active:
                active_admins.append(connection)
            else:
                self.admin_connections.discard(connection)
                self.last_admin_activity.pop(connection, None)
        return len(active_admins) > 0

    async def broadcast_admin_status(self):
        status_data = {
            "type": "presence_update",
            "admin_online": self.is_admin_online()
        }
        from starlette.websockets import WebSocketState
        # Send status update to all connected users
        for user_id in list(self.user_connections.keys()):
            for connection in list(self.user_connections[user_id]):
                if (connection.client_state != WebSocketState.CONNECTED or 
                        connection.application_state != WebSocketState.CONNECTED):
                    self.disconnect_user(user_id, connection)
            await self.send_to_user(user_id, status_data)

    async def send_to_user(self, user_id: int, data: dict):
        if user_id in self.user_connections:
            for connection in list(self.user_connections[user_id]):
                try:
                    await connection.send_json(data)
                except Exception:
                    self.disconnect_user(user_id, connection)

    async def send_to_all_admins(self, data: dict):
        for connection in list(self.admin_connections):
            try:
                await connection.send_json(data)
            except Exception:
                await self.disconnect_admin(connection)

manager = ConnectionManager()
