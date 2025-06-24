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
          margin-bottom: 24px;
        }
        
        .model-selector__label {
          display: block;
          margin-bottom: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
        }
        
        .model-selector__select {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          font-size: 16px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }
        
        .model-selector__select option {
          background: #1d4ed8;
          color: white;
          padding: 8px;
        }
        
        .model-selector__select:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.15);
        }
        
        .model-selector__description {
          margin-top: 12px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
          font-style: italic;
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }
      `}</style>
    </div>
  );
};

export default ModelSelector; 