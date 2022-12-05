# Meridian

Meridian provides several VSCode [Tree Views](https://code.visualstudio.com/api/extension-guides/tree-view) designed to improve the experience of working with large Markdown knowledge bases. The long term aim is to bring functionality familiar from tools like [Obsidian](https://obsidian.md/) to VSCode. 

> This extension is currently under active development and may contain bugs. For this reason and also because it is primarily designed for personal use, it is not currently available via the Extension store but [releases]() can be [manually installed](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix) via the VSIX file.

## Features

-  Filter workspace files by categories and tags at project and file level
-  Display internal backlinks and outlinks for each project file (without the need for custom link syntax)

### Forthcoming (pipeline)
-  View the relationship between files, links and their associated metadata with an integrated network graph
-  Create custom treeviews based on user's own metadata (not limited to just categories and tags) 
-  Extract file names from YAML `title` value instead of file path 
 

## Usage

Meridian loops recursively through each directory identifying Markdown files and indexes their metadata to produce the core four metadata tree-views: 
* Categories
* Tags
* Inlinks
* Outlinks

In order to generate the indices, each Markdown file should contain the following YAML frontmatter:
```
---
categories:
  - Category One
  - Category Two
tags: [first_tag, second_tag]
---
```
Outlinks and inlinks that point to other local Markdown files within the project are automatically extracted and parsed to populate their respective tree views. To ensure accurate indexation path shorthands should not be used  (e.g. `projectname/subdir/file.md` rather than `././file.md`.) Relative links are permitted.

Each view populates a list of links to Markdown files contained within the project, organised by the given metatdatum. The names of these files are parsed from the file path. Currently file paths are parsed based on underscores. Thus `A_file_name.md` will be parsed accurately but `A file name.md` may not.  


## Configuration
Settings can be configured via your VSCode `settings.json` file. 

#### `ignoreDirs`

Directories that you do not want to be indexed. Note `.git/` is automatically ignored. 

```json
{
  "meridian.ignoreDirs": ["dir-to-ignore"] 
}
```
## Screenshots 

![](/media/screenshot-all.png)

![](/media/screenshot-detail.png)

## Known Issues

Please see [issues](https://github.com/thomasabishop/meridian/issues)

