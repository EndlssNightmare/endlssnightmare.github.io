# InfoStatus Component Guide

The `InfoStatus` component is a reusable React component designed to display informational messages with different types and styling.

## Usage

### Basic Usage

```jsx
import InfoStatus from '../components/InfoStatus';

<InfoStatus 
  title="Info Status:" 
  message="Your informational message here" 
/>
```

### With Different Types

```jsx
// Info (default)
<InfoStatus 
  title="Info Status:" 
  message="This is an informational message" 
  type="info" 
/>

// Warning
<InfoStatus 
  title="Warning:" 
  message="This is a warning message" 
  type="warning" 
/>

// Success
<InfoStatus 
  title="Success:" 
  message="This is a success message" 
  type="success" 
/>

// Error
<InfoStatus 
  title="Error:" 
  message="This is an error message" 
  type="error" 
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | required | The title displayed in bold |
| `message` | string | required | The main message content |
| `type` | string | "info" | The type of status: "info", "warning", "success", "error" |

## Styling

The component automatically adapts to light and dark themes and includes:

- **Responsive design** for mobile devices
- **Hover effects** with subtle animations
- **Color-coded types** with appropriate backgrounds and borders
- **Icon integration** using React Icons (FaInfoCircle)
- **CSS custom properties** for theme compatibility

## In Markdown Content

When using in markdown content within writeups, use this format:

```markdown
<InfoStatus title="Info Status:" message="Your message here" />
<InfoStatus title="Warning:" message="Warning message" type="warning" />
<InfoStatus title="Success:" message="Success message" type="success" />
<InfoStatus title="Error:" message="Error message" type="error" />
```

## Examples in Context

### Initial Credentials
```markdown
<InfoStatus title="Info Status:" message="As is common in real life Windows pentests, you will start the Fluffy box with credentials for the following account: j.fleischman / J0elTHEM4n1990!" />
```

### Warning About Exploit Requirements
```markdown
<InfoStatus title="Warning:" message="This CVE-2025-24071 exploit requires careful timing and social engineering to be successful. The target user must open the malicious ZIP file in Windows File Explorer." type="warning" />
```

### Success Message
```markdown
<InfoStatus title="Success:" message="Successfully compromised the p.agila account! This gives us access to additional Active Directory privileges and moves us closer to domain compromise." type="success" />
```

## Customization

To customize the component, modify the CSS variables in `InfoStatus.css`:

```css
.info-status {
  --info-color: #3b82f6;
  --warning-color: #f59e0b;
  --success-color: #10b981;
  --error-color: #ef4444;
}
```

## Integration

The component is automatically processed in writeup markdown content. The markdown processor recognizes the `<InfoStatus>` tags and renders them as React components.
