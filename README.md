# Meridian

Meridian provides several VSCode [Tree Views](https://code.visualstudio.com/api/extension-guides/tree-view) designed to enhance the experience of working with large Markdown knowledge bases. The long term aim is to bring functionality familiar from tools like [Obsidian](https://obsidian.md/) to VSCode.

> This extension is currently under active development is primarily designed for personal use. It is not currently available via the Extension store but releases can be [manually installed](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix) via the VSIX file.

## Features

-  Filter workspace Markdown files by categories and tags
-  Display internal backlinks and outlinks for each project file

## Usage

Meridian loops recursively through each non-ignored directory. It identifies Markdown files and creates an index of the links and metadata to produce four metadata Tree Views:

-  Categories
-  Tags
-  Inlinks
-  Outlinks

In order to generate the indices, each Markdown file should contain the following YAML frontmatter:

```
---
categories:
  - Category One
  - Category Two
tags: [first_tag, second_tag]
---
```

Outlinks and inlinks that point to other local Markdown files within the project are automatically extracted and parsed to populate their respective Tree Views.

> To ensure accurate indexation path shorthands should not be used (e.g. `projectname/subdir/file.md` rather than `././file.md`) however relative links are permitted.

### Markdown file names

The listed names of the files that Meridian indexes are parsed from the file path. Currently, underscores are used as the delimiter. Thus `A_file_name.md` will be parsed as _A file name_ but `A file name.md` will not. Custom delimeters will be added in future.

### Future features

-  View the relationship between files, links and their associated metadata with an integrated network graph
-  Display a count of categories, tags, inlinks, outlinks
-  Use search input to filter the values in each TreeView

## Configuration

Settings should be configured at the workspace level, not globally. E.g. within `.vscode/settings.json` for the given project.

#### `ignoreDirs`

Provide an array of subdirectories within the workspace that you do not want to be indexed.

> Note `node-modules` and `.git/` are automatically ignored.

```json
{
   "meridian.ignoreDirs": ["dir-to-ignore"]
}
```

## Screenshots

![](/media/screenshot-all.png)

![](/media/screenshot-detail.png)
