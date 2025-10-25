export interface MessageProps {
  id: string;
  senderId: string;
  receiverId: string;
  listingId?: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export class MessageEntity {
  private props: MessageProps;

  private constructor(props: MessageProps) {
    this.props = props;
  }

  public static create(props: Omit<MessageProps, 'id' | 'read' | 'createdAt'>): MessageEntity {
    const now = new Date();
    return new MessageEntity({
      ...props,
      id: this.generateId(),
      read: false,
      createdAt: now,
    });
  }

  public static fromDatabase(props: MessageProps): MessageEntity {
    return new MessageEntity(props);
  }

  private static generateId(): string {
    return crypto.randomUUID();
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get senderId(): string {
    return this.props.senderId;
  }

  public get receiverId(): string {
    return this.props.receiverId;
  }

  public get listingId(): string | undefined {
    return this.props.listingId;
  }

  public get content(): string {
    return this.props.content;
  }

  public get read(): boolean {
    return this.props.read;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  // Business logic methods
  public markAsRead(): void {
    this.props.read = true;
  }

  public isFromUser(userId: string): boolean {
    return this.props.senderId === userId;
  }

  public isToUser(userId: string): boolean {
    return this.props.receiverId === userId;
  }

  public canBeDeletedBy(userId: string): boolean {
    return this.props.senderId === userId;
  }

  // Validation methods
  public isValid(): boolean {
    return this.validateContent() && this.validateUsers();
  }

  private validateContent(): boolean {
    return this.props.content.trim().length > 0 && this.props.content.length <= 2000;
  }

  private validateUsers(): boolean {
    return this.props.senderId !== this.props.receiverId;
  }

  // Serialization
  public toJSON(): MessageProps {
    return { ...this.props };
  }

  public toDatabase(): MessageProps {
    return { ...this.props };
  }
}
