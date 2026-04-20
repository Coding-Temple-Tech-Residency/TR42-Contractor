# MainFrame.tsx Usage Guide

## Overview

`MainFrame` is a reusable page wrapper component in `components/MainFrame.tsx`. It gives a screen:

- a shared background image
- a top header area
- a header menu area
- a scrollable body area
- a footer area with a bottom menu

It is useful when you want multiple screens to share the same overall layout and navigation structure.

## Where It Lives

- File: `components/MainFrame.tsx`

## What MainFrame Renders

1. An `ImageBackground` using `Assets.backgrounds.MainFrame.MainbackgroundImage`
2. A top spacer bar from `Styles.MainFrame.SpaceHeader`
3. A `Header` component controlled by the `header` prop
4. A top `Menu` component controlled by `headerMenu` or built automatically from the current route name
5. A `ScrollView` that renders the screen content passed through `children`
6. A footer area that can include custom injected content and the footer menu
7. A bottom spacer bar from `Styles.MainFrame.SpaceHeader`

## Props

### `children?: ReactNode`

This is the main content shown inside the scrollable body area. Whatever JSX you place between the opening and closing `MainFrame` tags will be rendered inside the `ScrollView`.

### `header?: HeaderVariant`

Accepted values:

- `default`
- `home`
- `none`

This prop controls which header variant appears near the top of the layout.

- `default`: Shows the centered logo header
- `home`: Shows the logo with the profile icon button
- `none`: Hides the `Header` component completely

Examples:

```tsx
<MainFrame header="default" />
<MainFrame header="home" />
<MainFrame header="none" />
```

If you do not pass `header`, `MainFrame` effectively falls back to the `Header` component default behavior unless `strip` is used to remove it.

### `headerMenu?: MenuOptions`

This overrides the menu shown below the header. `MenuOptions` is a tuple in the form:

```tsx
[variant, items]
```

The supported menu variants come from `components/Menu.tsx` and are:

- `Menu1`
- `Menu2`
- `Menu3`
- `none`

If `headerMenu` is not provided, `MainFrame` builds a default header menu with:

```tsx
["Menu2", [pageName]]
```

That means it shows the `Menu2` layout and uses the current route name as the title text.

### `footerMenu?: MenuOptions`

This overrides the menu shown in the footer area. If `footerMenu` is not provided, `MainFrame` uses:

```tsx
["Menu3", Menus.Footer]
```

That means the bottom navigation defaults to the footer menu items from `constants/Menus.jsx`.

### `strip?: "menus" | "all" | "header"`

This prop removes parts of the shared frame without needing to rewrite the layout.

- `menus`: Hides both the header menu and footer menu, but keeps the `Header` component
- `all`: Hides the `Header` component and both menus
- `header`: Hides the `Header` component only, but leaves the menus active

Important detail: `strip` does not remove `injectHeader` or `injectFooter`. Those custom injected areas can still render.

### `injectHeader?: ReactNode`

This lets you insert custom JSX below the built-in header and header menu area. It renders inside the top section after `Header` and `Menu`.

Use this when a specific screen needs extra content near the top, such as:

- tabs
- alerts
- filters
- a custom banner
- another custom component

### `injectFooter?: ReactNode`

This lets you insert custom JSX above the footer menu. It renders inside the footer container before the bottom `Menu` component.

Use this when a screen needs extra actions or information above the bottom navigation.

## How The Defaults Work Internally

`MainFrame` reads the current route name with `useRoute()`.

It stores `route.name` in `pageName`.

If menus are not stripped:

- the header menu defaults to `["Menu2", [pageName]]`
- the footer menu defaults to `["Menu3", Menus.Footer]`

If `strip` is `"all"` or `"header"`, the `Header` component is forced to `"none"`.

## Behavior Summary

- If `strip` is not passed, the screen shows the background, spacer, header, header menu, body, footer menu, and bottom spacer
- If `headerMenu` is passed, it replaces the automatic route-title menu
- If `footerMenu` is passed, it replaces the default `Menus.Footer` navigation
- If `injectHeader` is passed, it appears after the standard top frame elements
- If `injectFooter` is passed, it appears before the standard footer menu

## Examples

### Simple Example

Use `MainFrame` when you want a normal screen with a home-style header and the default footer menu.

```tsx
<MainFrame header="home">
  <YourScreenContent />
</MainFrame>
```

### Example With A Custom Header Title Menu

```tsx
<MainFrame
  header="default"
  headerMenu={["Menu2", ["Contacts"]]}
>
  <ContactsList />
</MainFrame>
```

### Example With Menus Removed

```tsx
<MainFrame strip="menus" header="home">
  <CustomContent />
</MainFrame>
```

### Example With Everything Stripped

```tsx
<MainFrame strip="all">
  <StandaloneContent />
</MainFrame>
```

### Example With Custom Injected Content

```tsx
<MainFrame
  injectHeader={<CustomTabs />}
  injectFooter={<FooterNotice />}
>
  <PageBody />
</MainFrame>
```

## Notes And Cautions

- The main content is placed inside a `ScrollView`, so long content should be added through `children`
- `Menu2` expects its title data in a shape that works with `props.menuOptions?.[1]?.[0]`. When the first item is a string like the route name, it is displayed as text
- The default footer items currently come from `Menus.Footer` in `constants/Menus.jsx`
- The `Header` component variants are defined in `components/Header.tsx`

## Related Files

- `components/MainFrame.tsx`
- `components/Header.tsx`
- `components/Menu.tsx`
- `constants/Menus.jsx`
- `constants/Styles.tsx`
- `constants/Assets.tsx`

## In Short

Use `MainFrame` when you want a shared screen shell with optional header variants, optional menus, scrollable page content, and optional custom content injected above the body or footer.
