"use client";

import React, { useState } from "react";
import { Avatar } from "./avatar";
import { ThumbsUp, ThumbsDown, Reply, MoreHorizontal } from "lucide-react";

export interface CommentItem {
    id?: string | number;
    author: string;
    avatar?: string;
    content: string;
    timestamp?: string;
    replies?: CommentItem[];
    likes?: number;
    dislikes?: number;
    liked?: boolean;
    disliked?: boolean;
}

export interface CommentProps {
    comments?: CommentItem[];
    comment?: CommentItem;
    showActions?: boolean;
    onReply?: (comment: CommentItem) => void;
    onLike?: (comment: CommentItem) => void;
    onDislike?: (comment: CommentItem) => void;
    className?: string;
}

function CommentNode({ comment, depth = 0, showActions, onReply, onLike, onDislike }: {
    comment: CommentItem;
    depth?: number;
    showActions?: boolean;
    onReply?: (c: CommentItem) => void;
    onLike?: (c: CommentItem) => void;
    onDislike?: (c: CommentItem) => void;
}) {
    const [showReplyInput, setShowReplyInput] = useState(false);

    return (
        <div className={`flex gap-3 ${depth > 0 ? "ml-10 mt-3" : ""}`}>
            <Avatar name={comment.author} src={comment.avatar} size="sm" className="flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <div
                    className="px-4 py-3 rounded-lg"
                    style={{ backgroundColor: "var(--gogo-grey-100)", borderRadius: "var(--radius-card)" }}
                >
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold" style={{ color: "var(--gogo-text-primary)" }}>{comment.author}</span>
                        {comment.timestamp && (
                            <span className="text-xs" style={{ color: "var(--gogo-text-secondary)" }}>{comment.timestamp}</span>
                        )}
                    </div>
                    <p className="text-sm" style={{ color: "var(--gogo-text-primary)" }}>{comment.content}</p>
                </div>
                {showActions && (
                    <div className="flex items-center gap-3 mt-1.5 px-2">
                        <button
                            type="button"
                            onClick={() => onLike?.(comment)}
                            className={`inline-flex items-center gap-1 text-xs transition-colors ${comment.liked ? "font-semibold" : ""}`}
                            style={{ color: comment.liked ? "var(--gogo-primary)" : "var(--gogo-text-secondary)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gogo-primary)")}
                            onMouseLeave={(e) => !comment.liked && (e.currentTarget.style.color = "var(--gogo-text-secondary)")}
                        >
                            <ThumbsUp className="w-3 h-3" />
                            {comment.likes !== undefined && comment.likes > 0 ? comment.likes : "Like"}
                        </button>
                        <button
                            type="button"
                            onClick={() => onDislike?.(comment)}
                            className={`inline-flex items-center gap-1 text-xs transition-colors ${comment.disliked ? "font-semibold" : ""}`}
                            style={{ color: comment.disliked ? "#ef4444" : "var(--gogo-text-secondary)" }}
                        >
                            <ThumbsDown className="w-3 h-3" />
                            {comment.dislikes !== undefined && comment.dislikes > 0 ? comment.dislikes : ""}
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowReplyInput((v) => !v); onReply?.(comment); }}
                            className="inline-flex items-center gap-1 text-xs transition-colors"
                            style={{ color: "var(--gogo-text-secondary)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--gogo-primary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--gogo-text-secondary)")}
                        >
                            <Reply className="w-3 h-3" />
                            Reply
                        </button>
                    </div>
                )}
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-2 space-y-0">
                        {comment.replies.map((reply, i) => (
                            <CommentNode key={reply.id ?? i} comment={reply} depth={depth + 1} showActions={showActions} onReply={onReply} onLike={onLike} onDislike={onDislike} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export function Comment({ comments = [], comment, showActions = true, onReply, onLike, onDislike, className = "" }: CommentProps) {
    const items = comment ? [comment] : comments;
    return (
        <div className={`space-y-4 ${className}`}>
            {items.map((c, i) => (
                <CommentNode key={c.id ?? i} comment={c} showActions={showActions} onReply={onReply} onLike={onLike} onDislike={onDislike} />
            ))}
        </div>
    );
}
