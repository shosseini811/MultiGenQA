import React, { useState } from 'react';
import { AIModel } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronDown, Bot, AlertCircle } from 'lucide-react';

/*
ModelSelector Component - Complete Beginner's Guide

This component allows users to select which AI model they want to chat with.
It demonstrates several important React and TypeScript concepts that are
essential for building interactive user interfaces.

=== What is This Component For? ===

In our multi-AI chat application, users can choose between different AI models:
- OpenAI GPT (ChatGPT)
- Google Gemini
- Anthropic Claude
- And potentially more in the future

This component provides a dropdown interface for selecting between these options.

=== Key React Concepts Demonstrated ===

1. **Functional Components**: Modern React components written as functions
   - Simpler than class components
   - Easier to understand and test
   - Better performance with React hooks

2. **Props**: Data passed from parent components
   - models: Array of available AI models
   - selectedModel: Currently selected model
   - onModelSelect: Function to call when user selects a model

3. **State Management**: Managing component's internal state
   - isOpen: Whether the dropdown is currently open or closed
   - useState hook to manage state in functional components

4. **Event Handling**: Responding to user interactions
   - Button clicks to open/close dropdown
   - Model selection clicks
   - Proper event handling patterns

5. **Conditional Rendering**: Showing different content based on state
   - Show dropdown options only when isOpen is true
   - Show "No models available" when models array is empty
   - Show different button text based on selection state

6. **Lists and Keys**: Rendering arrays of data
   - Mapping over models array to create dropdown options
   - Using unique keys for each list item (React requirement)

=== TypeScript Concepts Explained ===

1. **Interface Props**: Defining the shape of component props
   - ModelSelectorProps interface specifies expected props
   - Type safety ensures correct data is passed from parent
   - Provides IDE autocomplete and error checking

2. **Generic Types**: Working with typed arrays and objects
   - AIModel[]: Array of AIModel objects
   - selectedModel?: Optional AIModel (might be undefined)
   - Function types with specific parameters and return values

3. **Optional Properties**: Props that might not be provided
   - selectedModel?: The ? means this prop is optional
   - Component handles both cases (with and without selected model)

4. **Callback Functions**: Functions passed as props
   - onModelSelect: (model: AIModel) => void
   - Parent component provides this function
   - Child component calls it when user makes selection

=== UI/UX Design Patterns ===

1. **Dropdown Component**: Common interface pattern
   - Button to show current selection and open dropdown
   - List of options that appears when opened
   - Click outside or selection closes dropdown

2. **Visual Feedback**: Clear indication of current state
   - Selected model is highlighted with badge
   - Hover effects for better interactivity
   - Loading/empty states handled gracefully

3. **Information Architecture**: Well-organized content
   - Clear title and description
   - Visual icons for better recognition
   - Confirmation message when model is selected

4. **Accessibility**: Usable by everyone
   - Proper button semantics
   - Keyboard navigation support
   - Screen reader friendly structure

=== State Management Pattern ===

This component uses local state (useState) for UI state:
- isOpen: Controls dropdown visibility
- This is UI-only state that doesn't need to be shared with other components
- Parent component manages the actual model selection state

=== Event Handling Pattern ===

1. **Button Click**: Opens/closes dropdown
2. **Model Selection**: Calls parent's callback function and closes dropdown
3. **Click Outside**: Could be added to close dropdown (not implemented here)

=== Component Communication ===

This component communicates with its parent through:
- Props (data flowing down): models, selectedModel
- Callbacks (events flowing up): onModelSelect
- This is the standard React data flow pattern
*/

/*
Props Interface Definition

This interface defines exactly what props this component expects.
It's like a contract that says "if you want to use ModelSelector,
you must provide these props with these types."

Why define interfaces for props?
- **Type Safety**: TypeScript ensures parent provides correct props
- **Documentation**: Other developers can see what's required
- **IDE Support**: Autocomplete and error checking
- **Refactoring Safety**: Changes show all affected usage
*/
interface ModelSelectorProps {
  models: AIModel[];                            // Array of available AI models
  selectedModel?: AIModel;                      // Currently selected model (optional)
  onModelSelect: (model: AIModel) => void;      // Function to call when user selects a model
}

/*
Main Component Function

React.FC<ModelSelectorProps> means:
- This is a React Functional Component
- It expects props matching the ModelSelectorProps interface
- TypeScript will ensure we handle props correctly

The destructuring syntax { models, selectedModel, onModelSelect } extracts
the props from the props object for easier use.
*/
const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  models, 
  selectedModel, 
  onModelSelect 
}) => {
  /*
  Local State Management
  
  useState is a React Hook that lets us add state to functional components.
  
  const [isOpen, setIsOpen] = useState<boolean>(false);
  
  Breaking this down:
  - isOpen: The current state value (starts as false)
  - setIsOpen: Function to update the state
  - useState<boolean>: TypeScript knows this is a boolean state
  - (false): Initial value when component first renders
  
  When setIsOpen is called with a new value:
  1. React updates the state
  2. React re-renders the component with the new state
  3. UI updates to reflect the new state
  */
  const [isOpen, setIsOpen] = useState<boolean>(false);

  /*
  Event Handler Functions
  
  These functions respond to user interactions.
  They're defined inside the component so they have access to state and props.
  */
  
  /*
  Toggle Dropdown Function
  
  This function opens/closes the dropdown when the button is clicked.
  
  How it works:
  1. User clicks the dropdown button
  2. toggleDropdown is called
  3. setIsOpen(!isOpen) flips the current state
  4. Component re-renders with new state
  5. UI shows/hides dropdown based on new isOpen value
  
  The ! operator means "not" - so !isOpen means "opposite of current isOpen value"
  */
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  /*
  Handle Model Selection Function
  
  This function is called when user clicks on a specific model option.
  
  Parameters:
  - model: AIModel - The model that was clicked
  
  What it does:
  1. Calls the parent's onModelSelect function with the chosen model
  2. Closes the dropdown (sets isOpen to false)
  
  This demonstrates the "lifting state up" pattern:
  - Child component (ModelSelector) handles UI interactions
  - Parent component manages the actual selection state
  - Child notifies parent of changes through callback functions
  */
  const handleModelSelect = (model: AIModel) => {
    onModelSelect(model); // Notify parent component of selection
    setIsOpen(false);     // Close dropdown after selection
  };

  /*
  JSX Return Statement
  
  This is where we define what the component should render.
  JSX lets us write HTML-like syntax inside JavaScript.
  
  Key JSX concepts:
  - className instead of class (class is reserved in JavaScript)
  - Event handlers use camelCase (onClick, onChange)
  - JavaScript expressions go in curly braces {}
  - Self-closing tags need the slash: <ChevronDown />
  - Components start with capital letters
  */
  return (
    <Card className="w-full max-w-md mx-auto">
      
      {/* 
      Card Header Section
      
      This section provides context about what this component does.
      It uses shadcn/ui Card components for consistent styling.
      */}
      <CardHeader className="text-center">
        
        {/* Bot Icon - Visual indicator of AI functionality */}
        <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-blue-600" />
        </div>
        
        {/* Component Title */}
        <CardTitle className="text-lg font-semibold">Select AI Model</CardTitle>
        
        {/* Component Description */}
        <CardDescription>
          Choose which AI assistant you'd like to chat with
        </CardDescription>
      </CardHeader>

      {/* 
      Card Content Section
      
      This contains the main functionality - the dropdown selector.
      */}
      <CardContent className="space-y-4">
        
        {/*
        Conditional Rendering for Empty State
        
        This demonstrates conditional rendering - showing different content
        based on the current state of the data.
        
        models.length === 0 checks if the models array is empty.
        If it's empty, we show an error message instead of the dropdown.
        
        The && operator is a shorthand for conditional rendering:
        - If left side is true, render right side
        - If left side is false, render nothing
        */}
        {models.length === 0 ? (
          <div className="text-center py-4">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-gray-600">No AI models available</p>
            <p className="text-sm text-gray-500">Please check if the backend is running</p>
          </div>
        ) : (
          /*
          Main Dropdown Interface
          
          This is shown when we have models available.
          It includes the dropdown button and the options list.
          */
          <div className="relative">
            
            {/*
            Dropdown Toggle Button
            
            This button shows the current selection and opens/closes the dropdown.
            
            Key concepts:
            - onClick={toggleDropdown}: When clicked, call toggleDropdown function
            - Dynamic content: Button text changes based on selectedModel
            - CSS classes: Styling that responds to state
            */}
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={toggleDropdown}
            >
              
              {/*
              Dynamic Button Content
              
              This demonstrates conditional rendering inside JSX.
              We show different content based on whether a model is selected.
              
              selectedModel ? ... : ... is a ternary operator:
              - If selectedModel exists, show selectedModel.name
              - If selectedModel is null/undefined, show "Choose a model"
              */}
              <span>
                {selectedModel ? selectedModel.name : 'Choose a model'}
              </span>
              
              {/*
              Dropdown Arrow Icon
              
              The ChevronDown icon rotates based on dropdown state.
              transform and transition classes provide smooth animation.
              
              Template literal syntax `class-${condition}` allows dynamic class names.
              */}
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${
                  isOpen ? 'transform rotate-180' : ''
                }`} 
              />
            </Button>

            {/*
            Dropdown Options List
            
            This list is only shown when isOpen is true.
            It demonstrates conditional rendering and list rendering.
            
            isOpen && (...) means:
            - If isOpen is true, render the dropdown list
            - If isOpen is false, render nothing (dropdown is hidden)
            */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
                
                {/*
                Model Options List
                
                This demonstrates rendering a list from an array.
                
                models.map() creates a new array by transforming each model
                into a JSX element (a clickable option).
                
                Key concepts:
                - map() function: Transform array items into JSX elements
                - key prop: Required by React for list items (must be unique)
                - Event handlers: onClick for each option
                - Dynamic styling: Different styles for selected model
                */}
                {models.map((model) => (
                  <div
                    key={model.id}  // Unique key required by React for list items
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                      selectedModel?.id === model.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleModelSelect(model)}  // Handle click on this option
                  >
                    
                    {/* Model Name and Badge */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{model.name}</span>
                      
                      {/*
                      Selected Badge
                      
                      Only show "Selected" badge for the currently selected model.
                      This is another example of conditional rendering.
                      */}
                      {selectedModel?.id === model.id && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    
                    {/* Model Description */}
                    <p className="text-sm text-gray-600 mt-1">
                      {model.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/*
        Selection Confirmation Message
        
        When a model is selected, show a confirmation message.
        This provides feedback to the user about their choice.
        
        selectedModel && (...) means:
        - If selectedModel exists, show the confirmation
        - If selectedModel is null/undefined, show nothing
        */}
        {selectedModel && (
          <div className="text-center p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-700">
              ✅ Ready to chat with <strong>{selectedModel.name}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ModelSelector; 