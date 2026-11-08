from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from main.models import Conversation, Message, OutboxEvent


def append_message_created(
    db: Session,
    conversation: Conversation,
    message: Message,
    recipient_id: UUID,
) -> None:
    db.add(OutboxEvent(
        id=uuid4(),
        aggregatetype="chat-message",
        aggregateid=str(conversation.id),
        type="chat.message.created",
        payload={
            "messageId": str(message.id),
            "conversationId": str(conversation.id),
            "errandId": str(conversation.errand_id),
            "senderId": str(message.sender_id),
            "recipientId": str(recipient_id),
            "sequenceNumber": message.sequence_number,
            "createdAt": message.created_at.isoformat(),
        },
    ))

