"use client";

import {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  ReactElement,
  isValidElement,
  cloneElement,
  Children,
  JSX,
} from "react";
import { motion, AnimatePresence } from "motion/react";

// Context to share hover state for the animated ring
interface GrabContextValue {
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  values: Record<string, string>;
  updateValue: (id: string, value: string) => void;
}

const GrabContext = createContext<GrabContextValue | null>(null);

export function GrabProvider({
  children,
  onChange,
  initialValues = {},
}: {
  children: React.ReactNode;
  onChange?: (values: Record<string, string>) => void;
  initialValues?: Record<string, string>;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(initialValues);

  const updateValue = (id: string, value: string) => {
    const newValues = { ...values, [id]: value };
    setValues(newValues);
    onChange?.(newValues);
  };

  return (
    <GrabContext.Provider
      value={{ hoveredId, setHoveredId, values, updateValue }}
    >
      {children}
    </GrabContext.Provider>
  );
}

export function useGrab() {
  const context = useContext(GrabContext);
  if (!context) {
    throw new Error("useGrab must be used within a GrabProvider");
  }
  return context;
}

interface GrabProps {
  id: string;
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
  className?: string;
  multiline?: boolean;
  [key: string]: unknown; // Allow additional props like href, target, etc.
}

export function Grab({
  id,
  children,
  as: Component = "span",
  style,
  className,
  multiline = false,
  ...restProps
}: GrabProps) {
  const { hoveredId, setHoveredId, values, updateValue } = useGrab();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const childrenRef = useRef<HTMLElement>(null);

  // Extract text content from children
  const extractText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) {
      return node.map(extractText).join("");
    }
    if (isValidElement(node)) {
      const props = node.props as { children?: React.ReactNode };
      if (props.children) {
        return extractText(props.children);
      }
    }
    return "";
  };

  const initialText = extractText(children);
  const currentValue = values[id] ?? initialText;

  useEffect(() => {
    if (isEditing) {
      setEditValue(currentValue);
    }
  }, [isEditing, currentValue]);

  // Function to get computed styles from the original element
  const getComputedStyles = (): React.CSSProperties => {
    if (!childrenRef.current) {
      return {};
    }
    
    const computed = window.getComputedStyle(childrenRef.current);
    return {
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      fontStyle: computed.fontStyle,
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing,
      textAlign: computed.textAlign as React.CSSProperties["textAlign"],
      textDecoration: computed.textDecoration,
      textTransform: computed.textTransform,
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      // Preserve padding to match visual appearance
      paddingTop: computed.paddingTop,
      paddingRight: computed.paddingRight,
      paddingBottom: computed.paddingBottom,
      paddingLeft: computed.paddingLeft,
      // Preserve border and border radius
      border: computed.border,
      borderRadius: computed.borderRadius,
      // Text styling
      textIndent: computed.textIndent,
      wordSpacing: computed.wordSpacing,
      whiteSpace: "pre-wrap", // Always allow wrapping
      wordWrap: "break-word",
      // Additional text properties
      textShadow: computed.textShadow,
      fontVariant: computed.fontVariant,
      fontStretch: computed.fontStretch,
    };
  };

  useEffect(() => {
    if (isEditing && textareaRef.current && childrenRef.current) {
      // Use double requestAnimationFrame to ensure DOM and content are fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!textareaRef.current || !childrenRef.current) return;
          
          // Apply computed styles from the original element
          const computedStyles = getComputedStyles();
          Object.assign(textareaRef.current.style, computedStyles);
          
          // Ensure background stays transparent for the overlay effect
          textareaRef.current.style.backgroundColor = "transparent";
          
          // Measure the actual height of the original element (accounts for wrapped text)
          // Use getBoundingClientRect for more accurate measurement
          const originalRect = childrenRef.current.getBoundingClientRect();
          const originalHeight = originalRect.height;
          const originalScrollHeight = childrenRef.current.scrollHeight;
          
          // Set initial height to match the original element's height
          // Use scrollHeight if it's larger (for elements with overflow or padding)
          const initialHeight = Math.max(originalHeight, originalScrollHeight);
          
          // Set a minimum height first, then measure scrollHeight
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.minHeight = `${initialHeight}px`;
          
          // Force a reflow to ensure content is measured
          void textareaRef.current.offsetHeight;
          
          // Now get the actual scrollHeight with content
          const contentHeight = Math.max(initialHeight, textareaRef.current.scrollHeight);
          textareaRef.current.style.height = `${contentHeight}px`;
          textareaRef.current.style.minHeight = `${contentHeight}px`;
          
          textareaRef.current.focus();
          textareaRef.current.select();
        });
      });
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setHoveredId(null);
  };

  const handleBlur = () => {
    setIsEditing(false);
    updateValue(id, editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If multiline is false, Enter submits instead of creating new line
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      setIsEditing(false);
      updateValue(id, editValue);
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(currentValue);
    }
  };

  const isHovered = hoveredId === id;

  // Determine if component should be inline or block
  const isInlineElement = ["span", "a", "button"].includes(Component);

  return (
    <motion.span
      ref={wrapperRef}
      onClick={handleClick}
      onMouseEnter={() => {
        setHoveredId(id);
      }}
      onMouseLeave={() => {
        setHoveredId(null);
      }}
      style={{
        display: isInlineElement ? "inline-block" : "block",
        position: "relative",
        cursor: "pointer",
      }}
      title="Click to edit"
    >
      {/* Always render the children component to preserve its structure */}
      <Component
        {...({ ref: childrenRef } as any)}
        style={{
          ...style,
          ...(isEditing ? { opacity: 0 } : {}),
        }}
        className={className}
        {...restProps}
      >
        {currentValue}
      </Component>
      {/* Textarea overlay when editing - positioned absolutely to prevent layout shift */}
      {isEditing && (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value);
            // Auto-resize textarea to fit content
            if (textareaRef.current) {
              textareaRef.current.style.height = "auto";
              textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            resize: "none",
            overflow: "hidden",
            boxSizing: "border-box",
            // Height will be set dynamically in useEffect to match original element
            // Styles will be applied via useEffect from computed styles
          }}
        />
      )}
      {/* Absolute positioned hover effect - doesn't cause layout shift */}
      <AnimatePresence>
        {isHovered && !isEditing && (
          <motion.div
            layoutId="grab-ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              opacity: { duration: 0.15 },
            }}
            style={{
              position: "absolute",
              inset: "-4px",
              border: "2px solid #3b82f6",
              borderRadius: "6px",
              pointerEvents: "none",
              boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
              zIndex: 10,
            }}
          />
        )}
      </AnimatePresence>
    </motion.span>
  );
}

// Image grab component for editable images
interface GrabImageProps {
  id: string;
  src: string;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function GrabImage({
  id,
  src,
  alt = "",
  style,
  className,
  width,
  height,
}: GrabImageProps) {
  const { hoveredId, setHoveredId, values, updateValue } = useGrab();
  const elementRef = useRef<HTMLImageElement>(null);

  const currentSrc = values[id] ?? src;
  const isHovered = hoveredId === id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newUrl = prompt("Enter image URL:", currentSrc);
    if (newUrl) {
      updateValue(id, newUrl);
    }
  };

  return (
    <motion.div
      ref={elementRef}
      onClick={handleClick}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
      style={{
        position: "relative",
        cursor: "pointer",
        display: "inline-block",
      }}
      title="Click to change image"
    >
      <img
        src={currentSrc}
        alt={alt}
        style={style}
        className={className}
        width={width}
        height={height}
      />
      <AnimatePresence>
        {isHovered && (
          <motion.div
            layoutId="grab-ring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              opacity: { duration: 0.15 },
            }}
            style={{
              position: "absolute",
              inset: "-4px",
              border: "2px solid #3b82f6",
              borderRadius: "6px",
              pointerEvents: "none",
              boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.1)",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================
// Dynamic Parser for React Email Components
// ============================================

// React Email component types that contain text
const TEXT_COMPONENT_TYPES = [
  "Text",
  "Heading",
  "Link",
  "Button",
];

// React Email component types that contain images
const IMAGE_COMPONENT_TYPES = ["Img"];

// React Email structural components that should be converted to divs
const STRUCTURAL_COMPONENT_TYPES = [
  "Html",
  "Body",
  "Container",
  "Section",
];

// Components to skip (email-specific, not needed in preview)
const SKIP_COMPONENT_TYPES = ["Head", "Preview"];

// HTML elements that typically contain text
const TEXT_HTML_ELEMENTS = [
  "p",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "button",
  "label",
  "li",
  "td",
  "th",
  "div",
];

// Map React Email components to HTML equivalents
// Note: React Email's Button component renders as an <a> tag, not <button>
const COMPONENT_TO_HTML: Record<string, keyof JSX.IntrinsicElements> = {
  Text: "p",
  Heading: "h1",
  Link: "a",
  Button: "a", // React Email Button renders as <a> tag for email client compatibility
  Html: "div",
  Body: "div",
  Container: "div",
  Section: "div",
};

let idCounter = 0;

function generateId(prefix: string = "grab"): string {
  return `${prefix}-${idCounter++}`;
}

function getComponentName(element: ReactElement): string | null {
  const type = element.type;
  if (typeof type === "string") {
    return type;
  }
  if (typeof type === "function") {
    // Check displayName first (most reliable)
    const funcType = type as { displayName?: string; name?: string };
    if (funcType.displayName) return funcType.displayName;
    // Check name
    if (funcType.name) return funcType.name;
    // For React Email components, check if it's a forwardRef
    if ((type as any).render && typeof (type as any).render === "function") {
      const renderFn = (type as any).render;
      if (renderFn.displayName) return renderFn.displayName;
      if (renderFn.name) return renderFn.name;
    }
  }
  if (typeof type === "object" && type !== null) {
    // For forwardRef or memo components
    const typeObj = type as any;
    if (typeObj.displayName) return typeObj.displayName;
    // Check if it has a render function (forwardRef)
    if (typeObj.render && typeof typeObj.render === "function") {
      if (typeObj.render.displayName) return typeObj.render.displayName;
      if (typeObj.render.name) return typeObj.render.name;
    }
    // Check if it's a memo with a type
    if (typeObj.type) {
      const innerType = typeObj.type;
      if (typeof innerType === "function") {
        if (innerType.displayName) return innerType.displayName;
        if (innerType.name) return innerType.name;
      }
    }
  }
  return null;
}

function isTextOnlyChildren(children: ReactNode): children is string {
  if (typeof children === "string") {
    return children.trim().length > 0;
  }
  if (typeof children === "number") {
    return true;
  }
  return false;
}

function extractTextContent(children: ReactNode): string | null {
  if (typeof children === "string") {
    return children;
  }
  if (typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    const texts = children
      .map((child) => extractTextContent(child))
      .filter(Boolean);
    if (texts.length > 0 && texts.every((t) => t !== null)) {
      return texts.join("");
    }
  }
  return null;
}

export function parseToGrabbable(element: ReactNode, path: string = ""): ReactNode {
  // Reset counter at the start of parsing
  if (path === "") {
    idCounter = 0;
  }

  // Handle null/undefined
  if (element === null || element === undefined) {
    return element;
  }

  // Handle strings - these are text nodes, wrap them
  if (typeof element === "string") {
    const trimmed = element.trim();
    if (trimmed.length === 0) return element;
    const id = generateId("text");
    return <Grab key={id} id={id} as="span">{element}</Grab>;
  }

  // Handle numbers
  if (typeof element === "number") {
    const id = generateId("num");
    return <Grab key={id} id={id} as="span">{String(element)}</Grab>;
  }

  // Handle arrays
  if (Array.isArray(element)) {
    const parsed = element
      .map((child, index) => {
        const parsedChild = parseToGrabbable(child, `${path}[${index}]`);
        // Ensure each element has a key if it's a React element
        if (isValidElement(parsedChild) && (parsedChild.key === null || parsedChild.key === undefined)) {
          return cloneElement(parsedChild, { key: `${path}[${index}]` });
        }
        return parsedChild;
      })
      .filter((child) => child !== null && child !== undefined);
    return parsed.length > 0 ? parsed : null;
  }

  // Handle React elements
  if (isValidElement(element)) {
    const componentName = getComponentName(element);
    const elementType = element.type;
    const props = element.props as Record<string, unknown>;
    const children = props.children as ReactNode;
    const style = props.style as React.CSSProperties | undefined;

    // If this is a function component (not a built-in HTML element), render it first
    // Function components don't expose their rendered children in props.children
    if (typeof elementType === "function" && typeof elementType !== "string") {
      try {
        // Render the component to get its actual output
        const rendered = (elementType as any)(props);
        // Parse the rendered output
        return parseToGrabbable(rendered, path);
      } catch (error) {
        // If rendering fails, return the element as-is
        return element;
      }
    }

    // Handle actual HTML elements that shouldn't be in React (html, body, head)
    // Check both the type directly and the component name
    const isHtmlElement = 
      elementType === "html" || 
      elementType === "body" || 
      elementType === "head" ||
      componentName === "html" || 
      componentName === "body" || 
      componentName === "head";
    
    if (isHtmlElement) {
      const newChildren = children !== undefined 
        ? parseToGrabbable(children, `${path}.children`)
        : undefined;
      
      // Convert to div, preserve styles and other props
      const newProps: Record<string, unknown> = {};
      Object.keys(props).forEach((key) => {
        if (key !== "children" && key !== "dir" && key !== "lang" && props[key] !== undefined) {
          newProps[key] = props[key];
        }
      });

      return (
        <div key={element.key || undefined} {...newProps}>
          {newChildren}
        </div>
      );
    }

    // Skip email-specific components that aren't needed in preview
    if (componentName && SKIP_COMPONENT_TYPES.includes(componentName)) {
      return null;
    }

    // Convert React Email structural components to divs
    if (componentName && STRUCTURAL_COMPONENT_TYPES.includes(componentName)) {
      const newChildren = children !== undefined 
        ? parseToGrabbable(children, `${path}.children`)
        : undefined;
      
      // Preserve all props except children, convert to div
      const newProps: Record<string, unknown> = {};
      Object.keys(props).forEach((key) => {
        if (key !== "children" && props[key] !== undefined) {
          newProps[key] = props[key];
        }
      });

      return (
        <div key={element.key || undefined} {...newProps}>
          {newChildren}
        </div>
      );
    }

    // Handle React Email Img component
    if (componentName && IMAGE_COMPONENT_TYPES.includes(componentName)) {
      const id = generateId("img");
      return (
        <GrabImage
          key={id}
          id={id}
          src={props.src as string}
          alt={(props.alt as string) || ""}
          style={style}
          width={props.width as string | number}
          height={props.height as string | number}
        />
      );
    }

    // Handle img HTML element
    if (componentName === "img") {
      const id = generateId("img");
      return (
        <GrabImage
          key={id}
          id={id}
          src={props.src as string}
          alt={(props.alt as string) || ""}
          style={style}
          width={props.width as string | number}
          height={props.height as string | number}
        />
      );
    }

    // Handle React Email Button and Link components - preserve all props including href
    if (componentName === "Button" || componentName === "Link") {
      const textContent = extractTextContent(children);
      if (textContent !== null && textContent.trim().length > 0) {
        const hasOnlyText = 
          typeof children === "string" || 
          typeof children === "number" ||
          (Array.isArray(children) && children.every(c => typeof c === "string" || typeof c === "number"));
        
        if (hasOnlyText) {
          const id = generateId(componentName?.toLowerCase() || "link");
          // Button and Link both render as <a> tags
          const htmlElement = "a" as keyof JSX.IntrinsicElements;
          
          // Preserve all props (href, style, className, etc.)
          const linkProps: Record<string, unknown> = {
            href: props.href || "#",
            style: style,
          };
          
          // Copy all other props except children
          Object.keys(props).forEach((key) => {
            if (key !== "children" && props[key] !== undefined) {
              linkProps[key] = props[key];
            }
          });

          return (
            <Grab
              key={id}
              id={id}
              as={htmlElement}
              {...linkProps}
            >
              {textContent}
            </Grab>
          );
        }
      }
    }

    // Check if this is a text-containing component
    const isTextComponent =
      (componentName && TEXT_COMPONENT_TYPES.includes(componentName)) ||
      (componentName && TEXT_HTML_ELEMENTS.includes(componentName.toLowerCase()));

    if (isTextComponent) {
      const textContent = extractTextContent(children);
      // Only replace if we have pure text content (no nested React elements)
      if (textContent !== null && textContent.trim().length > 0) {
        // Check if children is just text (not mixed with other elements)
        const hasOnlyText = 
          typeof children === "string" || 
          typeof children === "number" ||
          (Array.isArray(children) && children.every(c => typeof c === "string" || typeof c === "number"));
        
        if (hasOnlyText) {
          const id = generateId(componentName?.toLowerCase() || "text");
          const htmlElement = componentName
            ? COMPONENT_TO_HTML[componentName] || componentName.toLowerCase()
            : "span";

          return (
            <Grab
              key={id}
              id={id}
              as={htmlElement as keyof JSX.IntrinsicElements}
              style={style}
            >
              {textContent}
            </Grab>
          );
        }
      }
    }

    // For other elements (including React Email components with nested children),
    // recursively process children
    if (children !== undefined) {
      const newChildren = parseToGrabbable(children, `${path}.children`);

      // Clone element with new children, preserving all other props
      const newProps: Record<string, unknown> = {};
      Object.keys(props).forEach((key) => {
        if (key !== "children" && props[key] !== undefined) {
          newProps[key] = props[key];
        }
      });

      return cloneElement(element, newProps, newChildren);
    }

    return element;
  }

  return element;
}

// Component that wraps children and makes them grabbable
export function GrabbableEmail({
  children,
  onChange,
}: {
  children: ReactNode;
  onChange?: (values: Record<string, string>) => void;
}) {
  const [grabbableContent, setGrabbableContent] = useState<ReactNode>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Only parse on the client side to avoid hydration mismatches
  useEffect(() => {
    setIsMounted(true);
    setGrabbableContent(parseToGrabbable(children));
  }, [children]);

  // During SSR and initial render, show the original children
  // This ensures server and client render the same HTML initially
  if (!isMounted) {
    return <GrabProvider onChange={onChange}>{children}</GrabProvider>;
  }

  return <GrabProvider onChange={onChange}>{grabbableContent}</GrabProvider>;
}
