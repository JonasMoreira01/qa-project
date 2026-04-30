# @inmediam/ui

A React component library built to deliver consistent, accessible, and on-brand UI across InMediam products. Built on [Radix UI](https://www.radix-ui.com/) and [Tailwind CSS](https://tailwindcss.com/).

[![npm version](https://img.shields.io/npm/v/@inmediam/ui.svg)](https://www.npmjs.com/package/@inmediam/ui)
[![License](https://img.shields.io/npm/l/@inmediam/ui.svg)](https://github.com/inmediam/design-system/blob/main/LICENSE)

---

## Documentation

Full documentation with live examples, props, theming, and accessibility notes:

**[inmediam.github.io/design-system](https://inmediam.github.io/design-system)**

---

## Installation

```bash
npm install @inmediam/ui
```

**Peer dependencies:** React 17+ and React DOM 17+ must be installed in your project.

---

## Setup

### 1. Tailwind CSS

Configure Tailwind to use the design system config. Extend `@inmediam/ui/tailwind` in your `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = require("@inmediam/ui/tailwind")("my-app")
```

Replace `"my-app"` with your app or project name so content paths resolve correctly.

### 2. PostCSS

Use the package PostCSS config (includes Tailwind and Autoprefixer):

```js
// postcss.config.js
module.exports = require("@inmediam/ui/postcss")
```

### 3. Styles

The base styles (Tailwind layers, design tokens, CSS variables) are bundled with the components. When you import any component from `@inmediam/ui`, the CSS is loaded automatically. Ensure your bundler processes CSS from `node_modules` (Vite, Next.js, and Create React App do this by default).

---

## Usage

```tsx
import { Button, Input, Dialog } from "@inmediam/ui"

function App() {
  return (
    <div>
      <Button variant="primary">Get Started</Button>
      <Input placeholder="Enter your email" />
    </div>
  )
}
```

### Available components

Accordion, Alert Dialog, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Checkbox, Collapsible, Command, Dialog, Drawer, Dropdown Menu, Input, Label, Menubar, Navigation Menu, Popover, Progress, Radio Group, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Switch, Table, Tabs, Textarea, Toggle, Tooltip, and more.

See the [Storybook](https://inmediam.github.io/design-system) for the full list and usage examples.

---

## License

MIT © [InMediam](https://github.com/inmediam/design-system)
