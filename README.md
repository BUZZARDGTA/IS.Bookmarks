# IS.Bookmarks
Create and update Illegal Services indexed websites in a single bookmark.

# Preview:
<p align="center">
  <img src="https://github.com/Illegal-Services/IS.Bookmarks/assets/62464560/afd570df-d7e5-4502-b7bc-f96b8ba2629e" alt="Preview Image">
  <br>
  <br>
  <img src="https://github.com/Illegal-Services/IS.Bookmarks/assets/62464560/7e49c1e9-c8e2-45f0-a123-a05570554b1a" alt="Preview Image">
</p>

## !THIS IS WORK IN PROGRESS!
The current version available on Firefox Add-ons is v1.4, it is a version writted by [@Grub4K](https://github.com/grub4k).<br />
However due to some bugs within these versions ([archive/Manifest-V2](https://github.com/Illegal-Services/IS.Bookmarks/tree/archive/Manifest-V2), [archive/Manifest-V3](https://github.com/Illegal-Services/IS.Bookmarks/tree/archive/Manifest-V3)), and the complexcity of the code to me;<br />
I have decided to re-write it entierely to something simpler.<br />
This new version will be v1.5, it will be released publicly as soon as Firefox fix their [background page bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1851373) introduced in v117.0

## [FIX] Before Releasing this new re-writted v1.5:
```
- Not my fault but after 30 seconds of execution, the background.js stops on Firefox (it's a FF bug)
  This can eventually be fixed later using: https://github.com/cadeyrn/bookmarks-organizer/issues/229#issuecomment-1705718886
```

## [TODO] Before Releasing this new re-writted v1.5:
```
- Make sure to translate bookmarks name from:

def encode_unicode_encoding(string: str, type: str):
    if type == "path":
        replacements = {
            '\\\\': 'U+005C',
            '\\/': 'U+002F',
        }
    else:
        replacements = {
            '\\': 'U+005C',
            '/': 'U+002F',
        }
    replacements.update({
        ':': 'U+003A',
        '*': 'U+002A',
        '?': 'U+003F',
        '"': 'U+0022',
        '<': 'U+003C',
        '>': 'U+003E',
        '|': 'U+007C',
    })
    for chars, replacement in replacements.items():
        string = string.replace(chars, replacement)
    return string

def decode_unicode_encoding(string: str, type: str):
    if type == "path":
        replacements = {
            'U+005C': '\\\\',
            'U+002F': '\\/',
        }
    else:
        replacements = {
            'U+005C': '\\',
            'U+002F': '/',
        }
    replacements.update({
        'U+003A': ':',
        'U+002A': '*',
        'U+003F': '?',
        'U+0022': '"',
        'U+003C': '<',
        'U+003E': '>',
        'U+007C': '|',
    })
    for chars, replacement in replacements.items():
        string = string.replace(chars, replacement)
    return string

def encode_html_entity_encoding(string: str):
    replacements = {
        '&': '&amp;',
        '"': '&quot;',
        '\'': '&#39;',
        '<': '&lt;',
        '>': '&gt;',
        ' ': '&nbsp;',
    }
    for chars, replacement in replacements.items():
        string = string.replace(chars, replacement)
    return string

def decode_html_entity_encoding(string: str):
    replacements = {
        '&amp;': '&',
        '&quot;': '"',
        '&#39;': '\'',
        '&lt;': '<',
        '&gt;': '>',
    }
    for chars, replacement in replacements.items():
        string = string.replace(chars, replacement)
    return string

def encode_url_encoding(string: str):
    replacements = {
        '%': '%25',
        ' ': '%20',
        '[': '%5B',
        ']': '%5D',
        '{': '%7B',
        '}': '%7D',
        '^': '%5E',
        '`': '%60',
        '#': '%23',
    }
    for chars, replacement in replacements.items():
        string = string.replace(chars, replacement)
    return string

def decode_url_encoding(string: str):
    replacements = {
        '%25': '%',
        '%20': ' ',
        '%5B': '[',
        '%5D': ']',
        '%7B': '{',
        '%7D': '}',
        '%5E': '^',
        '%60': '`',
        '%23': '#',
    }
    for chars, replacement in replacements.items():
        string = string.replace(chars, replacement)
    return string
```

## [TODO]:
```
- Make "Tutorial.html" text fit better all together, cuz rn it's ugly.
- Add status of the script if it's working or not visible on the extension's icon. https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
- Add automatic update of bookmark folder on SHA change from GitHub "IS.bookmarks.json" updates.
- Add Chrome, Opera, Edge browsers support.
```
