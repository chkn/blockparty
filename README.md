# Block Party

Convention-based web components with optional bridging to native code for use in a web view.

## Hello, World

A component in Block Party is called a Block. Here is a simple Block:

```typescript
export interface Props {
	who: string
}

export default ({ who }: Props) => (
	<h1>Hello, {who}!</h1>
)
```

1. Create a new directory and paste the above into a file called `index.tsx`.
2. Run `npx blockparty` in that directory to start a storybook where you can see your component and enter different values for `who`.

## Adding Metadata

Each Block can have a `README.md` file in its directory to provide additional metadata. Block Party will extract the name and description from the README in two ways:

### Using Frontmatter

Add YAML frontmatter at the top of your README:

```markdown
---
name: Hello Component
description: Greets whomever is specified.
---

# Detailed documentation...
```

### Using Markdown Structure

If frontmatter is not present (or missing the `name` or `description` fields), Block Party will extract metadata from the markdown structure:

- **Name**: The first heading (`# Heading`) in the document
- **Description**: The first paragraph of text after the heading

For example:

```markdown
# Hello Component

Greets whomever is specified.

## Usage

...
```

Both of the above will yield the name, "Hello Component" and description, "Greets whomever is specified."

The description will be displayed in the storybook UI when you select the block.

