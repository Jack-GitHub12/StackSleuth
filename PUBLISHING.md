# Publishing Guide for StackSleuth

This guide covers how to publish StackSleuth packages to npm.

## Prerequisites

1. **npm Account**: Ensure you have an npm account with publishing permissions
2. **npm Login**: Run `npm login` to authenticate
3. **Build Success**: All packages must build successfully

## Publishing Process

### 1. Prepare for Release

```bash
# Ensure everything builds
npm run build

# Run tests (when available)
npm run test

# Update version numbers if needed
# Edit package.json files in each package directory
```

### 2. Publish All Packages

**Option A: Publish all at once (recommended)**
```bash
npm run publish:all
```

**Option B: Publish individually**
```bash
# Publish core first (dependency for others)
npm publish --workspace=@stacksleuth/core

# Publish agents
npm publish --workspace=@stacksleuth/backend-agent
npm publish --workspace=@stacksleuth/frontend-agent
npm publish --workspace=@stacksleuth/vue-agent
npm publish --workspace=@stacksleuth/db-agent
npm publish --workspace=@stacksleuth/mongodb-agent

# Publish CLI last
npm publish --workspace=@stacksleuth/cli
```

### 3. Verify Publication

```bash
# Check that packages are available
npm info @stacksleuth/cli
npm info @stacksleuth/core
npm info @stacksleuth/backend-agent
npm info @stacksleuth/frontend-agent
npm info @stacksleuth/vue-agent
npm info @stacksleuth/db-agent
npm info @stacksleuth/mongodb-agent
```

### 4. Test Installation

```bash
# Test global CLI installation
npm install -g @stacksleuth/cli

# Test package installation
npm install @stacksleuth/core
```

## Version Management

### Semantic Versioning

Follow [SemVer](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Updating Versions

Update versions in all relevant `package.json` files:

```bash
# Example: Update to version 0.2.0
sed -i '' 's/"version": "0.1.0"/"version": "0.2.0"/g' package.json
sed -i '' 's/"version": "0.1.0"/"version": "0.2.0"/g' packages/*/package.json

# Update inter-package dependencies
sed -i '' 's/"@stacksleuth\/core": "\^0.1.0"/"@stacksleuth\/core": "^0.2.0"/g' packages/*/package.json
```

## Publishing Checklist

- [ ] All packages build successfully (`npm run build`)
- [ ] Tests pass (`npm run test`)
- [ ] Version numbers updated consistently
- [ ] README files are up to date
- [ ] CHANGELOG updated (if applicable)
- [ ] Git changes committed and pushed
- [ ] npm login completed
- [ ] All packages published successfully
- [ ] Installation tested from npm registry

## Troubleshooting

### Common Issues

1. **Authentication Error**
   ```bash
   npm login
   # Enter your npm credentials
   ```

2. **Version Already Exists**
   ```bash
   # Update version numbers and try again
   npm version patch --workspace=@stacksleuth/core
   ```

3. **Dependency Issues**
   ```bash
   # Ensure core is published before other packages
   npm publish --workspace=@stacksleuth/core
   ```

4. **Build Failures**
   ```bash
   # Clean and rebuild
   npm run clean
   npm run build
   ```

### Package-Specific Notes

- **@stacksleuth/core**: Must be published first (dependency for others)
- **@stacksleuth/cli**: Should be published last, includes all functionality
- **Agent packages**: Can be published in any order after core

## Rollback Procedure

If a bad version is published:

```bash
# Unpublish recent version (within 72 hours)
npm unpublish @stacksleuth/package-name@version

# Or deprecate the version
npm deprecate @stacksleuth/package-name@version "Reason for deprecation"
```

## Automation (Future)

Consider setting up automated publishing with:
- GitHub Actions on tag push
- Conventional commits for automatic versioning
- Automated testing before publish

## Support

For publishing issues:
- Check [npm documentation](https://docs.npmjs.com/cli/v8/commands/npm-publish)
- Contact npm support for registry issues
- Open GitHub issue for package-specific problems 