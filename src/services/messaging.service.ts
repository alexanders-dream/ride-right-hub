import { UserRepository } from '../domain/repositories/user.repository';
import { MessageRepository } from '../domain/repositories/message.repository';
import { ListingRepository } from '../domain/repositories/listing.repository';
import { MessageEntity } from '../domain/entities/message.entity';
import { UserEntity } from '../domain/entities/user.entity';
import { ListingEntity } from '../domain/entities/listing.entity';
import { SecurityValidation } from '../utils/security-validation';

export interface SendMessageDto {
  receiverId: string;
  listingId?: string;
  content: string;
}

export interface Conversation {
  messages: MessageEntity[];
  otherUser: UserEntity;
  listing?: ListingEntity;
}

export class MessagingService {
  constructor(
    private messageRepository: MessageRepository,
    private userRepository: UserRepository,
    private listingRepository: ListingRepository,
    private notificationService: NotificationService
  ) {}

  async sendMessage(senderId: string, messageData: SendMessageDto): Promise<MessageEntity> {
    // Validate sender and receiver
    const [sender, receiver] = await Promise.all([
      this.userRepository.findById(senderId),
      this.userRepository.findById(messageData.receiverId),
    ]);

    if (!sender || !receiver) {
      throw new NotFoundError('User not found');
    }

    // Validate content
    const sanitizedContent = SecurityValidation.sanitizeInput(messageData.content);
    if (!sanitizedContent || sanitizedContent.length === 0) {
      throw new ValidationError('Message content cannot be empty');
    }

    if (sanitizedContent.length > 2000) {
      throw new ValidationError('Message content cannot exceed 2000 characters');
    }

    // Validate listing if provided
    let listing: ListingEntity | null = null;
    if (messageData.listingId) {
      listing = await this.listingRepository.findById(messageData.listingId);
      if (!listing) {
        throw new NotFoundError('Listing not found');
      }
    }

    // Create message entity
    const message = MessageEntity.create({
      senderId,
      receiverId: messageData.receiverId,
      listingId: messageData.listingId,
      content: sanitizedContent,
    });

    // Save message
    const savedMessage = await this.messageRepository.save(message);

    // Send real-time notification
    await this.notificationService.sendMessageNotification(savedMessage);

    return savedMessage;
  }

  async getConversation(user1Id: string, user2Id: string, listingId?: string): Promise<Conversation> {
    const [messages, otherUser, listing] = await Promise.all([
      this.messageRepository.findConversation(user1Id, user2Id, listingId),
      this.userRepository.findById(user2Id),
      listingId ? this.listingRepository.findById(listingId) : Promise.resolve(null),
    ]);

    if (!otherUser) {
      throw new NotFoundError('User not found');
    }

    return {
      messages,
      otherUser,
      listing: listing || undefined,
    };
  }

  async getUserConversations(userId: string): Promise<ConversationSummary[]> {
    const conversations = await this.messageRepository.findUserConversations(userId);
    
    // Get user details for each conversation
    const conversationSummaries = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUserId = conversation.otherUserId;
        const otherUser = await this.userRepository.findById(otherUserId);
        const unreadCount = await this.messageRepository.getUnreadCount(userId, otherUserId);
        const lastMessage = conversation.lastMessage;

        return {
          otherUser: otherUser!,
          unreadCount,
          lastMessage,
          lastActivity: conversation.lastActivity,
        };
      })
    );

    return conversationSummaries;
  }

  async markMessagesAsRead(userId: string, messageIds: string[]): Promise<void> {
    await this.messageRepository.markAsRead(userId, messageIds);
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    return await this.messageRepository.getTotalUnreadCount(userId);
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Only allow sender to delete their own messages
    if (message.senderId !== userId) {
      throw new AuthorizationError('Cannot delete messages sent by others');
    }

    await this.messageRepository.delete(messageId);
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export interface ConversationSummary {
  otherUser: UserEntity;
  unreadCount: number;
  lastMessage?: MessageEntity;
  lastActivity: Date;
}

// Stub implementation for NotificationService (to be implemented later)
export class NotificationService {
  async sendMessageNotification(message: MessageEntity): Promise<void> {
    // Implementation would send real-time notification
    console.log(`Message notification sent for message: ${message.id}`);
  }
}
