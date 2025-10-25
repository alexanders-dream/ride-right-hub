import { MessageEntity } from '../entities/message.entity';

export interface MessageRepository {
  findById(id: string): Promise<MessageEntity | null>;
  save(message: MessageEntity): Promise<MessageEntity>;
  findConversation(user1Id: string, user2Id: string, listingId?: string): Promise<MessageEntity[]>;
  findUserConversations(userId: string): Promise<ConversationSummary[]>;
  markAsRead(userId: string, messageIds: string[]): Promise<void>;
  getUnreadCount(userId: string, otherUserId: string): Promise<number>;
  getTotalUnreadCount(userId: string): Promise<number>;
  delete(id: string): Promise<void>;
}

export interface ConversationSummary {
  otherUserId: string;
  lastMessage?: MessageEntity;
  lastActivity: Date;
  unreadCount: number;
}
