-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view their own conversations"
ON conversations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert their own conversations"
ON conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
ON conversations
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
ON conversations
FOR SELECT
USING (is_admin());

-- Admins can update all conversations
CREATE POLICY "Admins can update all conversations"
ON conversations
FOR UPDATE
USING (is_admin());

-- Admins can insert conversations (if needed)
CREATE POLICY "Admins can insert conversations"
ON conversations
FOR INSERT
WITH CHECK (is_admin());

-- Users can view messages from their conversations
CREATE POLICY "Users can view their own messages"
ON messages
FOR SELECT
USING (
  auth.uid() = computed_session_user_id
);

-- Users can insert messages in their conversations
CREATE POLICY "Users can insert messages in their conversations"
ON messages
FOR INSERT
WITH CHECK (
  auth.uid() = computed_session_user_id
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON messages
FOR SELECT
USING (is_admin());

-- Admins can insert messages (if needed)
CREATE POLICY "Admins can insert messages"
ON messages
FOR INSERT
WITH CHECK (is_admin());

-- Deny delete policies
CREATE POLICY "Deny delete for conversations" ON conversations FOR DELETE USING (false);
CREATE POLICY "Deny delete for messages" ON messages FOR DELETE USING (false);