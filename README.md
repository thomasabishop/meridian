# Meridian

Meridian provides a series of VSCode views designed to improve the experience of working with large Markdown knowledge bases.

The primary motivation is to bring [Obsidian]()-like functionality to VSCode in a way that harnesses the existing built-in Markdown support, reducing the need for the developer to use separate note-management software, without the burden of custom markup syntax. If you write Markdown and are prepared to use YAML frontmatter, you can get started with Meridian right away.

## Feature Overview

-  Filter workspace files by categories and tags at a global and local file level
-  Isolate backlinks and outlinks for each Markdown file (without the need for custom link syntax)
-  View the relationship between files, links and their associated metadata with an integrated network graph

## Example Usage

Meridian loops recursively through each directory identifying Markdown files and indexing their metadata to produce the core four [tree-views](): _Categories_, _Tags_, _Inlinks_, and _Outlinks_. This data is then aggregated to produce the network graph [web-view]().

In order to index metadata, each Markdown file should contain the following YAML frontmatter, e.g:

```
---
title: Symlinks
categories:
  - Linux
  - Programming Languages
tags: [shell, bash]
---
```

> The `title` property is optional. If you do not provide a title, this will be derived from the filename via your chosen string delimiter.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

-  `myExtension.enable`: enable/disable this extension
-  `myExtension.thing`: set to `blah` to do something

## Feature Demonstration

## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.

## Release Notes

Users appreciate release notes as you update your extension.

### 1.0.0

Initial release of ...

### 1.0.1

Fixed issue #.

### 1.1.0

Added features X, Y, and Z.
