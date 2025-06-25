import React from 'react';
import { AIModel } from '../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronDown, Bot, AlertCircle } from 'lucide-react';

/*
TypeScript Interface for Component Props

In React with TypeScript, we define "props" (properties) using interfaces.
Props are like function parameters - they're data passed from a parent component to a child component.

This interface tells TypeScript what props our ModelSelector component expects:
- models: an array of AIModel objects
- selectedModel: the currently selected model (could be undefined)
- onModelSelect: a function that gets called when user selects a model
*/
interface ModelSelectorProps {
  models: AIModel[];
  selectedModel?: AIModel;
  onModelSelect: (model: AIModel) => void;
}

/*
React Functional Component with TypeScript

This is a "functional component" - think of it as a function that returns HTML.
The ": React.FC<ModelSelectorProps>" part tells TypeScript:
- This is a React Functional Component
- It expects props that match the ModelSelectorProps interface
- Now uses a simple dropdown with Claude.ai colors
*/
export default function ModelSelector({ models, selectedModel, onModelSelect }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (models.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">No models available</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please check if the backend server is running.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose AI Model</CardTitle>
        <CardDescription>
          Select which AI model you want to chat with
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              {selectedModel ? selectedModel.name : 'Select a model'}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
          
          {isOpen && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-card border border-border rounded-md shadow-lg">
              {models.map((model) => (
                <button
                  key={model.id}
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between"
                  onClick={() => {
                    onModelSelect(model);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <span className="font-medium">{model.name}</span>
                  </div>
                  {selectedModel?.id === model.id && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {selectedModel && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Ready to chat with <strong>{selectedModel.name}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 