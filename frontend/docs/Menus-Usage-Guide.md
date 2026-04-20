# Menus.jsx Usage Guide

## Overview

`Menus.jsx` is a shared menu configuration file in `constants/Menus.jsx`.

It does not render UI by itself. Instead, it stores menu item arrays that are passed into the `Menu` component and then rendered by `MenuItem`.

In this project, `Menus` mainly provides:

- a header-style menu data set through `Menus.Main`
- a footer navigation data set through `Menus.Footer`

## Where It Lives

- File: `constants/Menus.jsx`

## What It Exports

`Menus.jsx` exports one object:

```jsx
export const Menus = { ... }
```

That object currently contains:

- `Main`
- `Footer`

## Menu Item Shape

Each menu item is an object with this structure:

```jsx
{
  label: string,
  icon?: imageSource,
  component: string
}
```

### `label`

`label` is the visible text shown for the menu option.

It is used by `MenuItem` when rendering the menu text.

Examples:

- `"Home"`
- `"Login"`
- `"Profile"`
- `"Tickets"`

### `icon`

`icon` is optional.

It is mainly used for footer-style navigation items that show an image above or beside the label.

The icons in `Menus.Footer` come from `Assets.icons`, such as:

- `Assets.icons.HomeIcon`
- `Assets.icons.TaskIcon`
- `Assets.icons.ContactIcon`

### `component`

`component` is the route name that gets passed into `navigation.navigate(...)`.

This must match a registered screen name in `App.tsx`.

Examples:

- `"Home"`
- `"Login"`
- `"Profile"`
- `"Tickets"`
- `"Contacts"`

## Current Exported Menus

### `Menus.Main`

`Menus.Main` is the top menu data set.

Current items:

```jsx
Main: [
  { label: "Home", component: "Home" },
  { label: "Login", component: "Login" },
  { label: "Profile", component: "Profile" },
  { label: "In Progress", component: "Blank" },
]
```

#### How `Menus.Main` is used

`Menus.Main` is used as menu data for top-level menu layouts, especially when a screen wants a list of text navigation options.

It is referenced in places like `MainFrame.tsx`.


### `Menus.Footer`

`Menus.Footer` is the bottom navigation data set.

Example items:

```jsx
Footer: [
  { label: "Home", icon: Assets.icons.HomeIcon, component: "Home" },
  { label: "Tickets", icon: Assets.icons.TaskIcon, component: "Tickets" },
  { label: "Contacts", icon: Assets.icons.ContactIcon, component: "Contacts" }
]
```

#### How `Menus.Footer` is used

`Menus.Footer` is the default footer menu for `MainFrame.tsx`.

If no custom `footerMenu` prop is passed to `MainFrame`, it uses:

```tsx
["Menu3", Menus.Footer]
```

That means the footer normally shows the Home, Tickets, and Contacts navigation options.

## How Menus.jsx Connects To Menu.tsx

`Menus.jsx` only provides data.

`components/Menu.tsx` is the component that decides how that data is displayed.

`Menu.tsx` supports these variants:

- `Menu1`
- `Menu2`
- `Menu3`
- `none`

The type is defined as:

```tsx
type MenuVariant = "Menu1" | "Menu2" | "Menu3" | "none"
export type MenuOptions = [variant: MenuVariant, items?: any[]]
```

So when you pass menu data into `Menu`, you pass a tuple like this:

```tsx
["Menu3", Menus.Footer]
```

or:

```tsx
["Menu1", Menus.Main]
```

## How Each Menu Variant Uses The Data

### `Menu1`

`Menu1` loops through the provided items and renders them with `MenuItem`.

This is useful when you want a row of menu items based on menu objects.

Example:

```tsx
<Menu menuOptions={["Menu1", Menus.Main]} />
```

### `Menu2`

`Menu2` is different.

It renders:

- a back arrow
- a centered title

It does **not** render a list of `MenuItem` objects.

Its title logic expects the first item in the second tuple slot:

```tsx
props.menuOptions?.[1]?.[0]
```

That is why `MainFrame.tsx` builds this by default:

```tsx
["Menu2", [pageName]]
```

So for `Menu2`, you normally pass a plain string title inside an array, not a full menu object list.

Example:

```tsx
<Menu menuOptions={["Menu2", ["Contacts"]]} />
```

### `Menu3`

`Menu3` loops through the provided items and renders them with `MenuItem`.

This is the variant used by `MainFrame` for the footer navigation.

Example:

```tsx
<Menu menuOptions={["Menu3", Menus.Footer]} />
```

### `none`

`none` hides the menu entirely.

Example:

```tsx
<Menu menuOptions={["none", []]} />
```

## How MainFrame Uses Menus.jsx

`MainFrame.tsx` uses menu data in two places:

### Header menu behavior

If menus are not stripped and no custom `headerMenu` is passed:

```tsx
["Menu2", [pageName]]
```

This means the header uses `Menu2` with the current route name as the title.

If you want `MainFrame` to use `Menus.Main` instead, you must pass it explicitly.

Example:

```tsx
<MainFrame headerMenu={["Menu1", Menus.Main]}>
  <YourContent />
</MainFrame>
```

### Footer menu behavior

If menus are not stripped and no custom `footerMenu` is passed:

```tsx
["Menu3", Menus.Footer]
```

This makes `Menus.Footer` the standard bottom navigation.

## Example Usage

### Use `Menus.Footer` in a normal MainFrame screen

```tsx
<MainFrame header="home">
  <ScreenContent />
</MainFrame>
```

This works because `MainFrame` automatically uses `Menus.Footer` as the footer menu.

### Use `Menus.Main` manually

```tsx
<MainFrame headerMenu={["Menu1", Menus.Main]}>
  <ScreenContent />
</MainFrame>
```

### Use a custom footer menu

```tsx
<MainFrame
  footerMenu={[
    "Menu3",
    [
      { label: "Home", icon: Assets.icons.HomeIcon, component: "Home" },
      { label: "Profile", icon: Assets.icons.ProfileIcon, component: "Profile" }
    ]
  ]}
>
  <ScreenContent />
</MainFrame>
```

## Notes And Cautions

- `Menus.jsx` is a data file, not a visual component
- `component` values must match real route names in `App.tsx`
- `Menu2` should usually receive a title string array like `["Menu2", ["ScreenName"]]`, not a list of menu objects
- `Menu1` and `Menu3` expect item arrays shaped like the objects inside `Menus.Main` and `Menus.Footer`
- If a route name in `component` does not exist in navigation, pressing that menu item will fail

## Related Files

- `constants/Menus.jsx`
- `components/Menu.tsx`
- `components/MenuItem.tsx`
- `components/MainFrame.tsx`
- `constants/Assets.tsx`
- `App.tsx`

## In Short

Use `Menus.jsx` to define reusable menu data sets, then pass those data sets into `Menu.tsx` or `MainFrame.tsx` to render shared navigation options across the app.
