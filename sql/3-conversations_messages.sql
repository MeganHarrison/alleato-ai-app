-- Drop existing tables if they exist
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- Conversations table
CREATE TABLE conversations (
    session_id VARCHAR PRIMARY KEY NOT NULL,
    user_id UUID NOT NULL,
    title VARCHAR,  -- Auto-generated from first message
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
   
    UNIQUE(session_id),
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- Messages table with computed columns for session_id components
CREATE TABLE messages (
    id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    computed_session_user_id UUID GENERATED ALWAYS AS (
        CAST(SPLIT_PART(session_id, '~', 1) AS UUID)
    ) STORED,
    session_id VARCHAR NOT NULL,
    message JSONB NOT NULL,
    message_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
   
    FOREIGN KEY (session_id) REFERENCES conversations(session_id)
);

-- Create indexes
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_computed_session ON messages(computed_session_user_id);