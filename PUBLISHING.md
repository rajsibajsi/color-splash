# 📦 Color Splash Package Publishing Guide

This guide explains how to publish the Color Splash library to npm and make it available for installation.

## 🚀 Quick Publishing Steps

### 1. Pre-Publication Checklist

Before publishing, ensure:

- [ ] **Update package.json**:
  - Change `@username/color-splash` to your actual npm username/organization
  - Update author information with your details
  - Verify repository URLs point to your GitHub repo
  - Bump version number if needed

- [ ] **Complete the build**:
  ```bash
  npm run clean
  npm run build
  npm run test
  npm run type-check
  ```

- [ ] **Verify package contents**:
  ```bash
  npm pack --dry-run
  ```

### 2. Initial npm Setup

If you haven't published to npm before:

```bash
# Create npm account at https://www.npmjs.com/signup
npm login
npm whoami  # Verify you're logged in
```

### 3. Publish to npm

```bash
# Option 1: Automatic (recommended)
npm publish

# Option 2: Manual with version bump
npm version patch  # or minor, major
npm publish
```

## 📋 Detailed Publication Process

### Step 1: Configure Package Name

Update `package.json` with your information:

```json
{
  "name": "@yourusername/color-splash",
  "author": {
    "name": "Your Name",
    "email": "your.email@example.com",
    "url": "https://github.com/yourusername"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/yourusername/color-splash.git"
  }
}
```

### Step 2: Choose Package Scope

**Option A: Scoped Package (Recommended)**
```json
{
  "name": "@yourusername/color-splash"
}
```
- Users install with: `npm install @yourusername/color-splash`
- Less chance of name conflicts
- Can be private or public

**Option B: Unscoped Package**
```json
{
  "name": "color-splash-lib"
}
```
- Users install with: `npm install color-splash-lib`
- Shorter name but `color-splash` might be taken
- Must be public

### Step 3: Version Management

Follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, backward compatible

```bash
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0
```

### Step 4: Test Before Publishing

```bash
# Run all checks
npm run prepublishOnly

# Test local installation
npm pack
npm install ./username-color-splash-1.0.0.tgz

# Test in a separate project
mkdir test-installation
cd test-installation
npm init -y
npm install ../username-color-splash-1.0.0.tgz
```

### Step 5: Publish

```bash
# For scoped packages (first time)
npm publish --access public

# For subsequent releases
npm publish
```

## 🏗️ Build System

The package is configured to build multiple formats:

- **UMD** (`dist/index.js`): Browser global variable
- **ES Modules** (`dist/index.esm.js`): Modern bundlers
- **CommonJS** (`dist/index.cjs.js`): Node.js require()
- **TypeScript** (`dist/index.d.ts`): Type definitions

### Build Commands

```bash
npm run clean          # Remove old builds
npm run build          # Build all formats
npm run build:watch    # Build with file watching
npm run size-check     # Check bundle sizes
```

## 📊 Package Information

After publishing, your package will be available:

- **npm**: `https://www.npmjs.com/package/@yourusername/color-splash`
- **GitHub**: `https://github.com/yourusername/color-splash`
- **Documentation**: Via your GitHub README

### Installation for Users

```bash
# npm
npm install @yourusername/color-splash

# yarn
yarn add @yourusername/color-splash

# pnpm
pnpm add @yourusername/color-splash
```

### Usage Examples

**ES Modules / TypeScript:**
```typescript
import { ColorSplash, ColorSpace, PreviewQuality } from '@yourusername/color-splash';

const colorSplash = new ColorSplash({
  previewQuality: PreviewQuality.HIGH,
  defaultColorSpace: ColorSpace.HSV
});
```

**CommonJS / Node.js:**
```javascript
const { ColorSplash, ColorSpace } = require('@yourusername/color-splash');
```

**Browser (UMD):**
```html
<script src="node_modules/@yourusername/color-splash/dist/index.js"></script>
<script>
  const colorSplash = new ColorSplash.ColorSplash();
</script>
```

## 🚀 Automated Publishing with GitHub Actions

The repository includes automated workflows:

### Continuous Integration
- Runs tests on Node.js 16, 18, 20
- Checks linting and TypeScript
- Builds package and verifies contents
- Measures bundle sizes

### Automated Publishing
- Triggers on GitHub releases
- Publishes to npm automatically
- Also publishes to GitHub Package Registry

### Setup Automated Publishing

1. **Create npm access token**:
   - Go to https://www.npmjs.com/settings/tokens
   - Create "Automation" token
   - Add as `NPM_TOKEN` in GitHub repository secrets

2. **Create GitHub release**:
   - Go to your repository's Releases
   - Click "Create a new release"
   - Tag version: `v1.0.0`
   - Release title: `v1.0.0`
   - Describe changes
   - Click "Publish release"

3. **Automatic publishing happens**:
   - GitHub Actions runs tests
   - Builds the package
   - Publishes to npm
   - Updates package registries

## 🔍 Package Quality Checks

### Bundle Analysis
```bash
npm run build
ls -lah dist/

# Check gzipped sizes
gzip -k dist/*.js
ls -lah dist/*.gz
```

### Security Audit
```bash
npm audit
npm audit fix  # Fix vulnerabilities
```

### Package Contents
```bash
npm pack --dry-run  # See what files will be published
```

## 📈 Post-Publication

### Monitor Package
- Check download stats: https://www.npmjs.com/package/@yourusername/color-splash
- Monitor for issues: https://github.com/yourusername/color-splash/issues

### Update Documentation
- Update README with installation instructions
- Create usage examples and tutorials
- Add badges for npm version, downloads, build status

### Community
- Share on social media, dev communities
- Create blog posts or tutorials
- Respond to issues and pull requests

## 🎯 Package Name Suggestions

If `color-splash` is taken, consider:

- `@yourusername/color-splash` (scoped - recommended)
- `color-splash-js`
- `selective-color`
- `image-color-splash`
- `color-preserve`
- `splash-effect`

## 📞 Troubleshooting

### Publishing Errors

**"Package name too similar"**:
- Choose a more unique name
- Use scoped package `@username/color-splash`

**"You cannot publish over the previously published versions"**:
- Bump version number: `npm version patch`
- Or use different package name

**"Permission denied"**:
- Verify npm login: `npm whoami`
- Check package name ownership
- For scoped packages: `npm publish --access public`

### Build Issues

**"TypeScript errors"**:
```bash
npm run type-check  # Check for errors
npm run lint:fix    # Fix linting issues
```

**"Missing files in package"**:
- Check `files` array in `package.json`
- Verify build output in `dist/` directory

## ✅ Success Checklist

After successful publishing:

- [ ] Package appears on npm: `npm view @yourusername/color-splash`
- [ ] Installation works: `npm install @yourusername/color-splash`
- [ ] All formats built correctly (UMD, ES, CommonJS)
- [ ] TypeScript types included and working
- [ ] README displays correctly on npm
- [ ] GitHub Actions run successfully
- [ ] Demo works with published package

---

**Congratulations! Your Color Splash library is now available for the world to use! 🎉**