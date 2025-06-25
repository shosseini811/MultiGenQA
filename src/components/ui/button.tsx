import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

/*
Button Component - Complete Beginner's Guide

This is a sophisticated, reusable button component that demonstrates advanced React
and TypeScript patterns used in modern design systems. It's built using shadcn/ui
principles and shows how to create flexible, accessible, and maintainable components.

=== What is a Design System Component? ===

A design system component is a reusable piece of UI that:
- Has consistent styling across the entire application
- Supports multiple variants (colors, sizes, styles)
- Is accessible by default
- Can be composed with other components
- Follows design principles and brand guidelines

=== Key Libraries and Concepts ===

1. **class-variance-authority (cva)**: Creates type-safe, variant-based styling
2. **@radix-ui/react-slot**: Enables component composition patterns
3. **React.forwardRef**: Passes refs through component boundaries
4. **TypeScript generics**: Advanced type safety and inference
5. **Tailwind CSS**: Utility-first CSS framework for styling

=== Advanced TypeScript Concepts Demonstrated ===

1. **Variant Props**: Type-safe way to handle component variants
2. **Interface Inheritance**: Extending existing interfaces
3. **Generic Components**: Components that work with multiple types
4. **Ref Forwarding**: Passing refs through component boundaries
5. **Conditional Types**: Types that change based on conditions

=== Accessibility Features ===

1. **Focus Management**: Proper focus states and keyboard navigation
2. **Screen Reader Support**: Semantic HTML and ARIA attributes
3. **Color Contrast**: Sufficient contrast ratios for all variants
4. **Disabled States**: Proper handling of disabled buttons
5. **Touch Targets**: Appropriate sizing for mobile devices

=== Component Composition Pattern ===

This component supports the "asChild" pattern, which allows it to render
as a different element while keeping all the styling and behavior.
This is useful for creating buttons that are actually links, or other
complex composition scenarios.

=== Performance Considerations ===

1. **Memoization**: Using React.forwardRef for optimal re-rendering
2. **CSS-in-JS Alternative**: Using class-based styling for better performance
3. **Bundle Size**: Efficient imports and tree-shaking friendly
4. **Runtime Performance**: Minimal JavaScript overhead
*/

/*
Button Variants Configuration

This uses class-variance-authority (cva) to create a type-safe variant system.
CVA is a powerful library that helps create consistent, variant-based styling
for components while maintaining excellent TypeScript support.

How CVA Works:
1. **Base Classes**: Common styles applied to all button variants
2. **Variants**: Different styling options (variant, size)
3. **Default Variants**: Fallback values when no variant is specified
4. **Type Safety**: TypeScript ensures only valid variants are used

Base Classes Explained:
- inline-flex: Makes button a flex container that flows with text
- items-center justify-center: Centers content horizontally and vertically
- whitespace-nowrap: Prevents text from wrapping to new lines
- rounded-md: Medium border radius for modern appearance
- text-sm font-medium: Typography styling for readability
- ring-offset-background: Creates space between focus ring and button
- transition-colors: Smooth color transitions for better UX
- focus-visible:outline-none: Removes default browser focus outline
- focus-visible:ring-2: Custom focus ring for accessibility
- disabled:pointer-events-none: Prevents interaction when disabled
- disabled:opacity-50: Visual indication of disabled state

Variant System Benefits:
- **Consistency**: All buttons follow the same design patterns
- **Maintainability**: Easy to update styles across the entire app
- **Type Safety**: TypeScript prevents invalid variant combinations
- **Performance**: Class-based styling is faster than inline styles
*/
const buttonVariants = cva(
  // Base classes applied to all button variants
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      /*
      Visual Variants - Different Button Styles
      
      Each variant serves a specific purpose in the UI hierarchy:
      */
      variant: {
        // Primary action button - most important actions
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        
        // Destructive actions - delete, remove, etc.
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        
        // Secondary actions - less prominent than primary
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        
        // Tertiary actions - subtle actions
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        
        // Minimal actions - very subtle, no background
        ghost: "hover:bg-accent hover:text-accent-foreground",
        
        // Link-style buttons - for navigation
        link: "text-primary underline-offset-4 hover:underline",
      },
      /*
      Size Variants - Different Button Sizes
      
      Different sizes for different contexts and hierarchy:
      */
      size: {
        // Standard size for most use cases
        default: "h-10 px-4 py-2",
        
        // Smaller size for compact interfaces
        sm: "h-9 rounded-md px-3",
        
        // Larger size for prominent actions
        lg: "h-11 rounded-md px-8",
        
        // Square size for icon-only buttons
        icon: "h-10 w-10",
      },
    },
    /*
    Default Variants
    
    These are used when no variant is explicitly specified.
    This ensures consistent behavior and prevents undefined states.
    */
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/*
Button Props Interface

This interface demonstrates advanced TypeScript patterns for creating
flexible, type-safe component APIs.

Interface Inheritance Explained:
- extends React.ButtonHTMLAttributes<HTMLButtonElement>: 
  Inherits all standard HTML button attributes (onClick, disabled, etc.)
- extends VariantProps<typeof buttonVariants>:
  Adds type-safe variant and size props from our CVA configuration

Why Use Interface Inheritance?
- **DRY Principle**: Don't repeat existing type definitions
- **Compatibility**: Works seamlessly with existing HTML button APIs
- **Type Safety**: TypeScript ensures all props are correctly typed
- **Intellisense**: IDE provides autocomplete for all available props

Custom Props:
- asChild?: boolean - Enables component composition pattern
  When true, renders as Slot instead of button element
  Useful for creating button-styled links or other elements
*/
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean  // Optional prop for component composition
}

/*
Button Component Implementation

This demonstrates several advanced React patterns:

1. **React.forwardRef**: Forwards refs to the underlying DOM element
2. **Component Composition**: Can render as different elements via asChild
3. **Props Destructuring**: Clean separation of component-specific and HTML props
4. **Conditional Rendering**: Different component types based on props

React.forwardRef Explained:
- Allows parent components to access the button's DOM element
- Essential for libraries like focus management, form libraries, etc.
- Maintains ref compatibility when wrapping components
- Required for proper integration with other React libraries

Generic Type Parameters:
- <HTMLButtonElement, ButtonProps>: Specifies ref type and props type
- Ensures type safety for both the ref and component props
- Provides proper TypeScript inference for consumers

Props Destructuring Pattern:
- { className, variant, size, asChild = false, ...props }
- Extracts component-specific props (className, variant, size, asChild)
- Spreads remaining props (...props) to the underlying element
- Provides default value for asChild (false)

Component Composition with Slot:
- const Comp = asChild ? Slot : "button"
- When asChild is true: Uses Radix Slot for composition
- When asChild is false: Uses regular button element
- Slot allows the component to merge with its child element
*/
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    /*
    Dynamic Component Selection
    
    This pattern allows the button to render as different elements
    while maintaining all styling and behavior.
    
    Examples:
    - <Button>Click me</Button> renders as <button>
    - <Button asChild><a href="/link">Click me</a></Button> renders as <a> with button styling
    
    Why Use This Pattern?
    - **Semantic Correctness**: Use proper HTML elements for their purpose
    - **Accessibility**: Screen readers understand the correct element type
    - **Flexibility**: One component can serve multiple use cases
    - **Styling Consistency**: Same visual appearance across different elements
    */
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        /*
        Class Name Composition
        
        cn() is a utility function that intelligently merges class names.
        It handles:
        - Conditional classes
        - Tailwind class conflicts (later classes override earlier ones)
        - Undefined/null values
        - Array and object syntax
        
        buttonVariants({ variant, size, className }) generates the appropriate
        classes based on the variant and size props, plus any additional className.
        
        This pattern ensures:
        - Consistent base styling from variants
        - Ability to override or extend styles via className prop
        - Proper handling of Tailwind CSS class conflicts
        */
        className={cn(buttonVariants({ variant, size, className }))}
        
        /*
        Ref Forwarding
        
        Passes the ref to the underlying element, whether it's a button
        or a Slot component. This maintains ref compatibility regardless
        of the component composition pattern being used.
        */
        ref={ref}
        
        /*
        Props Spreading
        
        {...props} spreads all remaining props to the underlying element.
        This includes:
        - Event handlers (onClick, onFocus, etc.)
        - HTML attributes (disabled, type, etc.)
        - ARIA attributes (aria-label, aria-describedby, etc.)
        - Data attributes (data-testid, etc.)
        
        This pattern ensures the component is a "good citizen" in the
        React ecosystem and works seamlessly with existing code.
        */
        {...props}
      />
    )
  }
)

/*
Display Name for Development Tools

Setting displayName helps with debugging and development tools.
React DevTools will show "Button" instead of "ForwardRef" in the
component tree, making it easier to debug and understand the app structure.

Why Set Display Names?
- **Debugging**: Clearer component names in React DevTools
- **Error Messages**: More helpful error messages and stack traces
- **Testing**: Easier to identify components in test environments
- **Documentation**: Self-documenting code for other developers
*/
Button.displayName = "Button"

/*
Exports

We export both the Button component and buttonVariants:
- Button: The main component for use in applications
- buttonVariants: The variant configuration for advanced use cases

Why Export buttonVariants?
- **Consistency**: Other components can use the same styling patterns
- **Extension**: Developers can create custom button-like components
- **Testing**: Easier to test styling logic separately
- **Documentation**: Style guide tools can introspect the variants
*/
export { Button, buttonVariants } 