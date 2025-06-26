import React from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

/*
ChatMessage Component - Complete Beginner's Guide

This component displays individual chat messages in our conversation interface.
It demonstrates fundamental React concepts for building reusable UI components
that adapt their appearance based on the data they receive.

=== What is This Component For? ===

In a chat application, messages need to be displayed differently based on who sent them:
- User messages: Aligned to the right, different color scheme
- AI messages: Aligned to the left, with AI model name and icon
- Each message shows the content and appropriate visual styling

This component handles the display logic for individual messages while keeping
the chat interface clean and organized.

=== Key React Concepts Demonstrated ===

1. **Functional Components**: Modern React components written as functions
   - Simpler syntax than class components
   - Easier to test and understand
   - Better performance with React's optimizations

2. **Props**: Data passed from parent components
   - message: Contains the actual message data
   - model: Optional AI model name to display
   - Props make components reusable with different data

3. **Conditional Rendering**: Showing different content based on data
   - Different styling for user vs AI messages
   - Different icons (User vs Bot)
   - Different names ("You" vs model name)

4. **JSX**: JavaScript XML syntax for writing UI
   - Looks like HTML but is actually JavaScript
   - Can embed JavaScript expressions with curly braces {}
   - Combines logic and presentation in a readable way

5. **CSS Classes**: Dynamic styling based on component state
   - Template literals for building class names
   - Conditional classes based on message role
   - Responsive design with Tailwind CSS

=== TypeScript Concepts Explained ===

1. **Interface Props**: Defining the shape of component props
   - ChatMessageProps interface specifies what props this component expects
   - TypeScript ensures parent components pass the right data
   - Provides autocomplete and error checking in IDE

2. **Optional Properties**: Props that might not be provided
   - model?: string means model is optional (might be undefined)
   - The ? makes it optional - component works with or without it
   - We provide fallback values when optional props aren't provided

3. **Type Safety**: Ensuring data has the expected structure
   - message: Message ensures the message prop matches our Message interface
   - Prevents runtime errors from incorrect data structures
   - Catches errors at compile time instead of runtime

4. **Union Types**: Properties that can have multiple specific values
   - message.role can be 'user' or 'assistant' (defined in Message interface)
   - TypeScript ensures we only use valid role values
   - Helps with conditional logic based on role

=== UI/UX Design Patterns ===

1. **Message Alignment**: Visual indication of who sent the message
   - User messages on the right (like most chat apps)
   - AI messages on the left with clear attribution
   - Consistent with user expectations from other chat interfaces

2. **Visual Hierarchy**: Clear distinction between different message types
   - Different background colors for user vs AI
   - Icons to quickly identify message source
   - Typography that emphasizes content while showing context

3. **Responsive Design**: Works well on all screen sizes
   - Flexible widths that adapt to content
   - Appropriate spacing and padding
   - Touch-friendly on mobile devices

4. **Accessibility**: Usable by everyone
   - Semantic HTML structure
   - Sufficient color contrast
   - Screen reader friendly content
   - Keyboard navigation support

=== Component Reusability ===

This component is designed to be reusable:
- Same component works for user and AI messages
- Behavior changes based on props (data-driven)
- No hardcoded content - everything comes from props
- Can be used in different contexts (chat, history, etc.)

=== Performance Considerations ===

1. **Pure Component**: Only re-renders when props change
2. **No State**: Stateless components are faster to render
3. **Minimal DOM**: Simple structure for better performance
4. **CSS Classes**: Using Tailwind for optimized styling
*/

/*
Props Interface Definition

This interface defines exactly what props this component expects.
It's like a contract that tells other developers (and TypeScript)
how to use this component correctly.

Why define interfaces for props?
- **Type Safety**: Prevents bugs from wrong data types
- **Documentation**: Shows what the component needs to work
- **IDE Support**: Enables autocomplete and error checking
- **Maintainability**: Easy to see what changes affect this component
*/
interface ChatMessageProps {
  message: Message;        // The message data (role and content)
  model?: string;          // Optional: AI model name for AI messages
}

/*
Main Component Function - Alternative Without React.FC

Instead of using React.FC<ChatMessageProps>, we can write the component
in a simpler way that many developers prefer:

const ChatMessage = ({ message, model }: ChatMessageProps) => {

This approach:
- Is more explicit about the props type
- Doesn't use React.FC (which some developers avoid)
- Still provides full TypeScript support
- Is the modern recommended way to write React components

Why some developers prefer this approach:
1. **Simpler syntax**: Less verbose than React.FC
2. **More explicit**: The props type is clearly visible
3. **Better IntelliSense**: Some IDEs provide better autocomplete
4. **Community preference**: Many React developers have moved away from React.FC
5. **Fewer imports**: You don't need to import React.FC specifically

Both approaches work exactly the same way - this is just a different
syntax for declaring the same component with the same TypeScript benefits.

The destructuring syntax { message, model } still extracts the props
from the props object for cleaner code inside the component.
*/
const ChatMessage = ({ message, model }: ChatMessageProps) => {
  /*
  Determine if this is a user message
  
  We check the message role to determine how to style and position the message.
  This boolean will be used throughout the component for conditional rendering.
  
  message.role === 'user' returns true if this is a user message,
  false if it's an assistant (AI) message.
  */
  const isUser = message.role === 'user';

  /*
  JSX Return Statement
  
  This defines what the component should render.
  We use conditional rendering and dynamic classes to show different
  layouts for user vs AI messages.
  
  Key JSX concepts demonstrated:
  - Template literals (`string ${variable}`) for dynamic class names
  - Conditional rendering with ternary operators (condition ? a : b)
  - Nested components and elements
  - Event handling (though not used in this component)
  */
  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/*
      Message Container
      
      This div contains the entire message bubble.
      The styling changes based on whether it's a user or AI message.
      
      Template literal explanation:
      `flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`
      
      Breaking this down:
      - flex items-start space-x-3 max-w-[80%]: Base classes for all messages
      - ${isUser ? 'flex-row-reverse space-x-reverse' : ''}: Conditional classes
      - If isUser is true: adds 'flex-row-reverse space-x-reverse' (right alignment)
      - If isUser is false: adds nothing (left alignment)
      */}
      <div className={`flex items-start space-x-3 max-w-[80%] ${
        isUser ? 'flex-row-reverse space-x-reverse' : ''
      }`}>
        
        {/*
        Avatar Section
        
        Shows an icon representing who sent the message:
        - User icon for user messages
        - Bot icon for AI messages
        
        The conditional rendering pattern:
        {isUser ? (user icon) : (bot icon)}
        
        This is a ternary operator - it's shorthand for:
        if (isUser) {
          return user icon;
        } else {
          return bot icon;
        }
        */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-blue-500' : 'bg-gray-500'
        }`}>
          {isUser ? (
            <User className="w-5 h-5 text-white" />
          ) : (
            <Bot className="w-5 h-5 text-white" />
          )}
        </div>

        {/*
        Message Content Section
        
        Contains the message bubble with text and metadata.
        Styling adapts based on message type.
        */}
        <div className="flex-1">
          
          {/*
          Message Header
          
          Shows who sent the message.
          For user messages: "You"
          For AI messages: Model name (if provided) or "Assistant"
          
          Another example of conditional rendering:
          - isUser ? 'You' : (model || 'Assistant')
          - If user message: show "You"
          - If AI message: show model name if provided, otherwise "Assistant"
          
          The || operator is the "logical OR" - it provides a fallback value.
          model || 'Assistant' means "use model if it exists, otherwise use 'Assistant'"
          */}
          <div className={`text-sm font-medium mb-1 ${
            isUser ? 'text-blue-600' : 'text-gray-700'
          }`}>
            {isUser ? 'You' : (model || 'Assistant')}
          </div>

          {/*
          Message Bubble
          
          The actual message content in a styled bubble.
          Background color and text color change based on sender.
          
          Dynamic styling explanation:
          - User messages: Blue background, white text (bg-blue-500 text-white)
          - AI messages: Light gray background, dark text (bg-gray-100 text-gray-800)
          
          The message.content contains the actual text to display.
          In JSX, {message.content} evaluates the JavaScript expression
          and inserts the result into the HTML.
          */}
          <div className={`inline-block px-4 py-2 rounded-lg max-w-full ${
            isUser 
              ? 'bg-blue-500 text-white rounded-br-none' 
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}>
            
            {/*
            Message Text Content
            
            The actual message text with proper formatting.
            
            Key styling:
            - whitespace-pre-wrap: Preserves line breaks and spacing from the original text
            - break-words: Allows long words to wrap to prevent overflow
            
            Why these styles matter:
            - Users might send messages with line breaks
            - AI responses might contain formatted text
            - Long URLs or technical terms need to wrap properly
            - Prevents messages from breaking the layout
            */}
            <p className="whitespace-pre-wrap break-words">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 