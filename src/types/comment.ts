export interface Comment {
  id: string;
  content: string;
  author: string;
  memberName: string;
  timestamp: number;
  likes: number;
  likedBy: string[];
  replies: Reply[];
}

export interface Reply {
  id: string;
  content: string;
  author: string;
  timestamp: number;
  likes: number;
  likedBy: string[];
  replyTo?: string;
}

export interface CommentFormData {
  content: string;
  memberName: string;
}

export interface ReplyFormData {
  content: string;
  commentId: string;
  replyTo?: string;
}
