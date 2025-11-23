# Style Guide - Color System & Accessibility

## 🎨 Color Usage Rules

### **CRITICAL: Always use CSS variables from `src/styles/colors.css`**

**❌ NEVER:**
- Use hardcoded hex colors: `color: #FF0000;`
- Use hardcoded rgb/rgba: `color: rgb(255, 0, 0);`
- Use color names: `color: white;`, `color: black;`
- Use inline styles with colors: `<div style={{ color: '#000' }}>`

**✅ ALWAYS:**
- Use CSS variables: `color: var(--color-text-main);`
- Import colors.css in your CSS files: `@import "../styles/colors.css";`
- Reference the color system documentation below

---

## 📋 Available Color Variables

### Primary Brand Colors
```css
--color-primary          /* Main brand color - Only brand color to be used */
```

**Note:** Only one primary brand color is used. For light backgrounds, borders, and other variations, use the greyscale color system instead.

### Greyscale (WCAG AA Compliant)
```css
--color-grey-900         /* Primary text (16.5:1 contrast) */
--color-grey-800         /* Secondary text (13.1:1 contrast) */
--color-grey-700         /* Tertiary text (8.6:1 contrast) */
--color-grey-600         /* (6.2:1 contrast) */
--color-grey-500         /* Muted text (4.6:1 - meets normal text) */
--color-grey-400         /* Subtle text (2.8:1 - large text only) */
--color-grey-300         /* Borders, disabled states */
--color-grey-200         /* Subtle borders */
--color-grey-100         /* Backgrounds */
--color-grey-50          /* Alternate row backgrounds */
--color-white            /* Pure white */
--color-black            /* Pure black */
```

### Semantic Colors
```css
--color-text-main        /* Primary text color */
--color-text-muted       /* Muted/secondary text */
--color-text-subtle      /* Subtle text (large text only) */
--color-text-inverse     /* White text for dark backgrounds */
--color-bg-page          /* Page background */
--color-bg-card          /* Card background */
--color-border-subtle    /* Subtle borders */
--color-border-strong    /* Strong borders */
```

### Status Colors
```css
--color-error            /* Error states (5.1:1 contrast) */
--color-success          /* Success states (4.6:1 contrast) */
--color-warning          /* Warning states (4.5:1 contrast) */
--color-info             /* Info states (4.7:1 contrast) */
```

---

## ♿ WCAG Accessibility Guidelines

### Contrast Requirements

**Normal Text (14px+):**
- Minimum contrast ratio: **4.5:1**
- Use: `--color-grey-500` or darker

**Large Text (18px+ or 14px+ bold):**
- Minimum contrast ratio: **3:1**
- Use: `--color-grey-400` or darker

**Text Color Guidelines:**
- Primary text: `--color-text-main` (16.5:1) ✅
- Secondary text: `--color-text-muted` (4.6:1) ✅
- Subtle text: `--color-text-subtle` (2.8:1) ⚠️ Large text only
- Borders: `--color-grey-300` or lighter (not for text)

### Examples

```css
/* ✅ Good - High contrast for body text */
.body-text {
  color: var(--color-text-main);
}

/* ✅ Good - Meets normal text requirement */
.secondary-text {
  color: var(--color-text-muted);
}

/* ⚠️ Use only for large text (18px+ or bold) */
.subtle-text {
  color: var(--color-text-subtle);
  font-size: 18px; /* or font-weight: bold */
}

/* ❌ Bad - Too low contrast for normal text */
.bad-text {
  color: var(--color-grey-400); /* Only 2.8:1 */
}
```

---

## 🔍 Code Review Checklist

When reviewing code, check:

- [ ] No hardcoded hex colors (`#FF0000`)
- [ ] No hardcoded rgb/rgba colors (`rgb(255, 0, 0)`)
- [ ] No color names (`white`, `black`, `red`)
- [ ] All colors use CSS variables from `colors.css`
- [ ] Text colors meet WCAG contrast requirements
- [ ] Large text (18px+ or bold) can use `--color-text-subtle`
- [ ] Normal text uses `--color-text-main` or `--color-text-muted`

---

## 🛠️ Migration Guide

If you find hardcoded colors:

1. **Identify the color purpose:**
   - Text? → Use `--color-text-*`
   - Background? → Use `--color-bg-*`
   - Border? → Use `--color-border-*`
   - Status? → Use `--color-error`, `--color-success`, etc.

2. **Check contrast:**
   - Text on white background? Use `--color-grey-500` or darker
   - Large text? Can use `--color-grey-400`

3. **Replace:**
   ```css
   /* Before */
   color: #6B7280;
   
   /* After */
   color: var(--color-text-muted);
   ```

---

## 📚 Resources

- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Color system defined in: `src/styles/colors.css`

---

**Remember: Consistency and accessibility are non-negotiable. Always use the color system!**

