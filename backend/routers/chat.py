from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Message
from schemas import MessageCreate, MessageResponse
from auth import get_current_user

router = APIRouter()

# 存储活跃的WebSocket连接
active_connections = {}

# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_text(message)

manager = ConnectionManager()

# WebSocket聊天端点
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    db: Session = Depends(get_db)
):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            receiver_id = data.get("receiver_id")
            content = data.get("content")

            if not receiver_id or not content:
                continue

            # 保存消息到数据库
            message = Message(
                sender_id=user_id,
                receiver_id=receiver_id,
                content=content
            )
            db.add(message)
            db.commit()

            # 发送给接收者
            message_data = {
                "sender_id": user_id,
                "content": content,
                "timestamp": str(message.timestamp)
            }
            await manager.send_personal_message(
                f"{message_data}",
                receiver_id
            )

    except WebSocketDisconnect:
        manager.disconnect(user_id)

# 获取聊天记录
@router.get("/messages/{user_id}", response_model=List[MessageResponse])
async def get_messages(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 获取两人之间的所有消息
    messages = db.query(Message).filter(
        ((Message.sender_id == current_user.id) & (Message.receiver_id == user_id)) |
        ((Message.sender_id == user_id) & (Message.receiver_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()

    # 标记消息为已读
    for message in messages:
        if message.receiver_id == current_user.id and not message.is_read:
            message.is_read = True
    db.commit()

    return messages

# 发送消息（REST API方式，备用）
@router.post("/messages")
async fn send_message(
    message: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 保存消息
    db_message = Message(
        sender_id=current_user.id,
        receiver_id=message.receiver_id,
        content=message.content
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    return db_message
