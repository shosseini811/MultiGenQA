import React from 'react';
import { AIModel } from '../types';

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

The component renders a dropdown/select element with all available AI models.
*/
const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onModelSelect
}) => {
  return (
    <div className="model-selector">
      <label htmlFor="model-select" className="model-selector__label">
        Choose AI Model:
      </label>
      
      <select
        id="model-select"
        className="model-selector__select"
        value={selectedModel?.id || ''}
        onChange={(e) => {
          // Find the selected model by its ID
          const selected = models.find(model => model.id === e.target.value);
          if (selected) {
            onModelSelect(selected);
          }
        }}
      >
        <option value="">Select a model...</option>
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      
      {selectedModel && (
        <p className="model-selector__description">
          {selectedModel.description}
        </p>
      )}
      
      <style>{`
        .model-selector {
          margin-bottom: 20px;
        }
        
        .model-selector__label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }
        
        .model-selector__select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          background-color: white;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }
        
        .model-selector__select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .model-selector__description {
          margin-top: 8px;
          font-size: 14px;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default ModelSelector; 